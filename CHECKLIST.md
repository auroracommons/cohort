# The 110 percent checklist: Cohort

Bedrock alignment: this repo serves Layer 3: Belonging in the Bedrock needs map, aligned October 15, 2026.

State as of October 15, 2026. Every line carries its evidence; a line without evidence does not count as done. This file is maintained by the daily evolution pass.

## 100 percent: completeness
- [x] Every file of the verified local publish tree present on GitHub, proven by tree diff: 19 of 19 publish tree files present (October 15, 2026), plus AGENTS.md and .github/workflows/ci.yml added since the publish tree snapshot, for 21 tracked files total
- [x] README accurate against the code, including the MCP server claim (7 tools with output schemas, verified by the test suite below)
- [x] LICENSE present
- [x] COLLABORATE.md present
- [x] CONTRIBUTING.md present
- [x] CI workflow present (.github/workflows/ci.yml: API tests, then the server is started and the MCP live session demo runs)

## The extra 10 percent
- [x] CI green on GitHub runners (latest runs at f3e1c3d successful, including the MCP demo step that was fixed in the open after its first run failed without a running server)
- [x] Repo description and topics set (description states the MCP room claim; topics: ai-agents, collaboration, education, mcp, model-context-protocol, verified by API read back October 15, 2026)
- [x] Good first issues open: #1 add a REST API test, #2 record a demo session and write the walkthrough (both labeled good first issue, sized in hours)
- [x] Tagged release: v0.1.0, first verified baseline (published, marked Latest)
- [x] Live demo: https://jthomas48896f.github.io/cohort/ (HTTP 200 verified October 15, 2026; the Pages landing renders the project README until a dedicated demo page is pushed, as recorded in the portfolio tracker)

## Verification baseline (October 15, 2026)
- `npm test` from a clean state (no local data.json, the same state CI starts from): 7 of 7 tests pass locally (6 REST API tests plus 1 MCP protocol test: handshake, tool list with output schemas, and real tool calls)
- Repeat run finding, logged not hidden: a second `npm test` on the same local data.json fails the upvote test (expected 200, got 409), because that test votes with a fixed handle and the vote persists in data.json. CI is unaffected (fresh state every run). Fix queued below.
- Recorded agent session: test/evidence/mcp-session.json (agent message verified landed in the room)

## Upgrade queue (from the evolution strategy, in order)
Each item needs a short spec with a verify by line before a daily pass picks it up. Ranking follows the weakest measured area first.
- [ ] Make the test suite repeatable on a dirty local data.json (unique voter handle per run, or isolated test state), so `npm test` passes on repeat runs, not only from clean state. Found October 15, 2026, see verification baseline above.
- [ ] Agent task history in room state: let an agent see what it and other agents already did in a room, so multi session work has memory. Next capability upgrade.
- [ ] Auth model decision documented, then scoped agent identities for the MCP server
- [ ] Uptime demo instance, so the workspace itself (not only the Pages landing) is reachable without running a local server
- [ ] Session recordings beyond the committed MCP transcript

## Working agreements
- AGENTS.md in this repo governs how changes are made and proven here.
- Known limits, stated in the README and not hidden here: no accounts or auth yet, document sync is last write wins, and persistence is a single data.json file for one server process.
