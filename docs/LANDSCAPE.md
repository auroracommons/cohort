# Landscape: the Model Context Protocol and agent native workspaces, late 2026

A short scan run on 2026-10-14 to ground this project's roadmap. Sources are
linked; the projection at the end is labeled as projection.

## Where the field is

**MCP became the default agent interface.** Introduced by Anthropic in
November 2024, the protocol was donated to the Linux Foundation's Agentic AI
Foundation in December 2025 and is now the cross-vendor standard, supported
across Anthropic, OpenAI, Google, Microsoft, and the major editors. By
mid 2026 there were over 10,000 public MCP servers and roughly 97 million
monthly SDK downloads.

- https://andrew.ooo/answers/mcp-model-context-protocol-enterprise-adoption-july-2026/
- https://forkast.news/glossary/model-context-protocol-mcp/

**The protocol itself is moving toward stateless, typed, and governed.**
The July 2026 spec revision removed the session handshake so remote servers
can sit behind ordinary load balancers, with servers passing explicit
handles in tool arguments instead. Typed tool outputs (outputSchema and
structuredContent) moved from good practice into the spec's orbit
(SEP-2106), and a Tasks extension (SEP-1686) covers long running agent work.
Design guidance has converged on the same points: small sharp tool
surfaces, structured and composable outputs, pagination and server side
filtering so agents do not pay tokens for rows they do not need, and
machine readable errors rather than stack traces.

- https://dev.to/monuminu/model-context-protocol-mcp-the-complete-developer-guide-to-building-production-grade-ai-agents-ah3
- https://dev.to/harsh0026/model-context-protocol-mcp-the-new-standard-for-ai-tool-integration-1b83

**Security and authorization are the open problem.** A September 2026 OX
Security analysis of 15,465 published MCP servers found agents reaching
ungoverned infrastructure, and enterprise authorization (identity aware,
scoped, auditable) is the active frontier: an enterprise authorization
layer and identity assertion work are in preview, precisely because the
protocol deliberately leaves where a server runs and who may call it to the
operator.

- https://www.morningstar.com/news/pr-newswire/20260924ny55298/new-research-mcp-servers-connect-ai-agents-to-china-russia-home-networks-and-abandoned-domains

## Projection (projection, not a claim)

Over the next 12 to 24 months, workspaces built for humans will plausibly
be expected to offer an agent interface as a matter of course, and the
differentiator will shift from "has MCP" to the quality of the agent's
working conditions: typed room state an agent can plan over, scoped
identities for agents distinct from human users, and an auditable history
of what the agent did. Collaboration tools that treat agents as invisible
API callers will look dated next to tools that treat them as accountable
participants in the room.

## How Cohort is positioned

Shipped now: an MCP server (`mcp-server.js`) that is a real client of the
workspace rather than a backdoor. It joins rooms over WebSocket under its
own handle, so everything it does is visible to the humans present. All
seven tools declare output schemas and return structured content;
`get_room_state` returns the whole planning surface (project, document,
recent chat, presence) in one call; errors are structured with machine
readable codes. A recorded session transcript lives at
`test/evidence/mcp-session.json`, and the protocol behavior is covered by
the automated test suite (`npm test`, 7 tests passing as of 2026-10-14).

Next along this trajectory, in order: agent task history in room state (so
an agent can see what it and other agents already did), then the
authorization question the whole field is working on: scoped agent
identities tied to the workspace's own auth model, once Cohort has one.
