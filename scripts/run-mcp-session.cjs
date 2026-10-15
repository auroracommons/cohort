#!/usr/bin/env node
// Records a real MCP session against a running Cohort server as evidence:
// boots the MCP server over stdio, performs the handshake, lists tools,
// reads a room, posts a chat message as the agent, and saves the full
// transcript to test/evidence/mcp-session.json.
//
// Usage: start the Cohort server first (node server.js), then:
//   node scripts/run-mcp-session.cjs
// The transcript is committed so anyone can see the agent working in a
// room without taking our word for it.

'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'test', 'evidence', 'mcp-session.json');

async function main() {
  const proc = spawn('node', ['mcp-server.js'], { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] });
  const rl = readline.createInterface({ input: proc.stdout });
  const pending = new Map();
  const transcript = [];
  let nextId = 1;

  rl.on('line', (line) => {
    let msg;
    try { msg = JSON.parse(line); } catch { return; }
    transcript.push({ direction: 'server->client', message: msg });
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });

  const call = (method, params) => new Promise((resolve, reject) => {
    const id = nextId++;
    const msg = { jsonrpc: '2.0', id, method, params };
    transcript.push({ direction: 'client->server', message: msg });
    pending.set(id, resolve);
    proc.stdin.write(JSON.stringify(msg) + '\n');
    setTimeout(() => reject(new Error(`Timed out: ${method}`)), 20000);
  });
  const notify = (method) => {
    const msg = { jsonrpc: '2.0', method };
    transcript.push({ direction: 'client->server', message: msg });
    proc.stdin.write(JSON.stringify(msg) + '\n');
  };

  try {
    await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'cohort-evidence-runner', version: '1.0.0' } });
    notify('notifications/initialized');
    await call('tools/list', {});
    const projects = await call('tools/call', { name: 'list_projects', arguments: {} });
    const firstId = projects.result.structuredContent.projects[0].id;
    await call('tools/call', { name: 'get_room_state', arguments: { project_id: firstId } });
    await call('tools/call', { name: 'post_chat', arguments: { project_id: firstId, text: 'Evidence session: an external agent posting through the MCP server.' } });
    const after = await call('tools/call', { name: 'get_room_state', arguments: { project_id: firstId } });
    const landed = after.result.structuredContent.chat.some(m => m.text.includes('Evidence session'));
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({ recordedAt: new Date().toISOString(), cohortUrl: process.env.COHORT_URL || 'http://localhost:3000', agentMessageLanded: landed, transcript }, null, 2));
    console.log(`Transcript saved to ${path.relative(ROOT, OUT)}. Agent message landed in room: ${landed}`);
    if (!landed) process.exitCode = 1;
  } finally {
    proc.kill('SIGTERM');
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
