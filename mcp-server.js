// Cohort MCP server.
//
// Exposes a Cohort workspace to external AI agents over the Model Context
// Protocol (stdio transport, newline-delimited JSON-RPC). It is a real
// client of the Cohort server, not a backdoor: projects come from the REST
// API, and room state (shared document, chat) comes from joining the room
// over WebSocket exactly like a human's browser does. Anything the agent
// does here is visible to the humans in the room, under the agent's handle.
//
// Agent native by design, not a thin wrapper:
// - Every tool declares an outputSchema and returns structuredContent, so
//   a client can plan over typed room state instead of parsing prose.
// - get_room_state returns the full planning surface in one call: project
//   metadata, the shared document, recent chat, and who is present.
// - Errors come back as structured tool errors (isError) with a machine
//   readable code, never as stack traces.
//
// Configuration (environment):
//   COHORT_URL          Base URL of the Cohort server. Default http://localhost:3000
//   COHORT_AGENT_HANDLE Handle the agent joins rooms under. Default "agent"
//
// Run: node mcp-server.js   (after the Cohort server itself is running)

'use strict';

const WebSocket = require('ws');

const BASE = (process.env.COHORT_URL || 'http://localhost:3000').replace(/\/+$/, '');
const WS_BASE = BASE.replace(/^http/, 'ws');
const HANDLE = process.env.COHORT_AGENT_HANDLE || 'agent';
const PROTOCOL_VERSION = '2024-11-05';

// ---------------------------------------------------------------------------
// Cohort REST helpers
// ---------------------------------------------------------------------------

async function rest(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Cohort API ${res.status}`);
    err.code = res.status === 404 ? 'not_found' : res.status === 409 ? 'conflict' : 'api_error';
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Room access over WebSocket. Opens a short lived connection, joins the
// room, performs the action, closes. Mirrors what a browser client does.
// ---------------------------------------------------------------------------

function roomSession(projectId, { onInit, act, settleMs = 250, timeoutMs = 8000 }) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_BASE);
    const timer = setTimeout(() => { ws.terminate(); reject(new Error('Room session timed out')); }, timeoutMs);
    const done = (fn, value) => { clearTimeout(timer); try { ws.close(); } catch { /* already closed */ } fn(value); };

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'join', projectId, handle: HANDLE }));
    });
    ws.on('error', (err) => done(reject, err));
    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.type === 'error') return done(reject, Object.assign(new Error(msg.message), { code: 'room_error' }));
      if (msg.type === 'init') {
        try {
          const init = { project: msg.project, doc: msg.doc, chat: msg.chat, activity: msg.activity || [], members: msg.members };
          if (onInit) await onInit(init);
          if (act) {
            await act(ws, init);
            // Actions are broadcast based; give the server a beat to apply
            // and persist before we report success.
            setTimeout(() => done(resolve, init), settleMs);
          } else {
            done(resolve, init);
          }
        } catch (err) {
          done(reject, err);
        }
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Tool definitions (with output schemas) and handlers
// ---------------------------------------------------------------------------

const projectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' }, name: { type: 'string' }, pitch: { type: 'string' },
    founder: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } },
    upvotes: { type: 'number' }, createdAt: { type: 'number' },
    repo: { type: ['string', 'null'] },
    demo: { type: 'boolean', description: 'True for seeded demonstration projects (demo founders, demo backing and demo room notes), not real teams or real participation.' },
  },
  required: ['id', 'name', 'pitch', 'founder', 'upvotes'],
};

const TOOLS = [
  {
    name: 'list_projects',
    description: 'List every project on the Cohort board, most upvoted context included. Projects with demo=true are seeded demonstration data, not real teams or real participation. Use this to discover room ids before calling room tools.',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: { type: 'object', properties: { projects: { type: 'array', items: projectSchema } }, required: ['projects'] },
    handler: async () => ({ projects: await rest('GET', '/api/projects') }),
  },
  {
    name: 'get_project',
    description: 'Get one project by id (board metadata only; use get_room_state for the document and chat).',
    inputSchema: { type: 'object', properties: { project_id: { type: 'string' } }, required: ['project_id'] },
    outputSchema: projectSchema,
    handler: async ({ project_id }) => rest('GET', `/api/projects/${encodeURIComponent(project_id)}`),
  },
  {
    name: 'get_room_state',
    description: 'Read the full state of a project room in one call: project metadata, the shared working document, recent chat history, the room activity log (what was already done here, by whom, and when), and the handles currently present. This is the planning surface for an agent deciding what to do in the room.',
    inputSchema: { type: 'object', properties: { project_id: { type: 'string' } }, required: ['project_id'] },
    outputSchema: {
      type: 'object',
      properties: {
        project: projectSchema,
        doc: { type: 'string' },
        chat: { type: 'array', items: { type: 'object', properties: { from: { type: 'string' }, text: { type: 'string' }, ts: { type: 'number' } } } },
        activity: { type: 'array', items: { type: 'object', properties: { ts: { type: 'number' }, actor: { type: 'string' }, kind: { type: 'string' }, detail: { type: 'string' } } } },
        members: { type: 'array', items: { type: 'string' } },
      },
      required: ['project', 'doc', 'chat', 'members'],
    },
    handler: async ({ project_id }) => {
      const state = await roomSession(project_id, {});
      return { project: state.project, doc: state.doc, chat: state.chat, activity: state.activity, members: state.members };
    },
  },
  {
    name: 'get_task_history',
    description: 'Read a room\'s activity log on its own: the recorded history of what happened in the room (project created or adopted, upvotes, chat messages, document updates, AI requests and replies), newest last, up to the most recent 50 entries. Use it to see what you and other agents already did in a room before acting.',
    inputSchema: { type: 'object', properties: { project_id: { type: 'string' } }, required: ['project_id'] },
    outputSchema: {
      type: 'object',
      properties: {
        activity: { type: 'array', items: { type: 'object', properties: { ts: { type: 'number' }, actor: { type: 'string' }, kind: { type: 'string' }, detail: { type: 'string' } } } },
      },
      required: ['activity'],
    },
    handler: async ({ project_id }) => {
      const project = await rest('GET', `/api/projects/${encodeURIComponent(project_id)}`);
      return { activity: project.activity || [] };
    },
  },
  {
    name: 'post_chat',
    description: 'Post a message to a project room chat. The message appears under the agent handle and is persisted in room history. Returns the room state after posting so the agent can confirm it landed.',
    inputSchema: { type: 'object', properties: { project_id: { type: 'string' }, text: { type: 'string' } }, required: ['project_id', 'text'] },
    outputSchema: {
      type: 'object',
      properties: { posted: { type: 'boolean' }, chatTail: { type: 'array', items: { type: 'object' } } },
      required: ['posted'],
    },
    handler: async ({ project_id, text }) => {
      await roomSession(project_id, {
        act: (ws) => ws.send(JSON.stringify({ type: 'chat', text: String(text).slice(0, 2000) })),
        settleMs: 400,
      });
      const state = await roomSession(project_id, {});
      return { posted: true, chatTail: state.chat.slice(-5) };
    },
  },
  {
    name: 'update_doc',
    description: 'Replace the shared working document in a project room (last write wins, same rule as for humans). Returns the document as stored after the update so the agent can verify its edit.',
    inputSchema: { type: 'object', properties: { project_id: { type: 'string' }, text: { type: 'string' } }, required: ['project_id', 'text'] },
    outputSchema: {
      type: 'object',
      properties: { updated: { type: 'boolean' }, doc: { type: 'string' } },
      required: ['updated', 'doc'],
    },
    handler: async ({ project_id, text }) => {
      await roomSession(project_id, {
        act: (ws) => ws.send(JSON.stringify({ type: 'doc', text: String(text).slice(0, 200000) })),
        settleMs: 400,
      });
      const state = await roomSession(project_id, {});
      return { updated: true, doc: state.doc };
    },
  },
  {
    name: 'create_project',
    description: 'Pitch a new project to the board. Creates its room with an empty document and chat.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' }, pitch: { type: 'string' }, founder: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'pitch', 'founder'],
    },
    outputSchema: projectSchema,
    handler: async (args) => rest('POST', '/api/projects', args),
  },
  {
    name: 'upvote_project',
    description: 'Upvote a project under a handle. One upvote per handle; a repeat returns a conflict error.',
    inputSchema: { type: 'object', properties: { project_id: { type: 'string' }, handle: { type: 'string' } }, required: ['project_id', 'handle'] },
    outputSchema: { type: 'object', properties: { ok: { type: 'boolean' }, upvotes: { type: 'number' } }, required: ['ok', 'upvotes'] },
    handler: async ({ project_id, handle }) => rest('POST', `/api/projects/${encodeURIComponent(project_id)}/upvote`, { handle }),
  },
];

// ---------------------------------------------------------------------------
// JSON-RPC over stdio
// ---------------------------------------------------------------------------

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function toolResult(structured) {
  return {
    content: [{ type: 'text', text: JSON.stringify(structured, null, 2) }],
    structuredContent: structured,
    isError: false,
  };
}

function toolError(err) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: err.code || 'internal_error', message: err.message }) }],
    structuredContent: { error: err.code || 'internal_error', message: err.message },
    isError: true,
  };
}

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') {
    return send({
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: 'cohort-mcp', version: '1.0.0' },
      },
    });
  }
  if (method === 'notifications/initialized' || method === 'notifications/cancelled') return;
  if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} });
  if (method === 'tools/list') {
    return send({
      jsonrpc: '2.0', id,
      result: { tools: TOOLS.map(({ name, description, inputSchema, outputSchema }) => ({ name, description, inputSchema, outputSchema })) },
    });
  }
  if (method === 'tools/call') {
    const tool = TOOLS.find(t => t.name === params?.name);
    if (!tool) {
      return send({ jsonrpc: '2.0', id, result: toolError(Object.assign(new Error(`Unknown tool ${params?.name}`), { code: 'unknown_tool' })) });
    }
    try {
      const structured = await tool.handler(params.arguments || {});
      return send({ jsonrpc: '2.0', id, result: toolResult(structured) });
    } catch (err) {
      return send({ jsonrpc: '2.0', id, result: toolError(err) });
    }
  }
  if (id !== undefined) {
    return send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    handle(msg).catch((err) => {
      if (msg.id !== undefined) send({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: err.message } });
    });
  }
});
