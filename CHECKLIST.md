# The 110 percent checklist: Cohort

Ascent alignment: this repo serves Layer 3: Belonging in the Ascent needs map, aligned October 15, 2026.

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
- [x] Live demo: https://auroracommons.github.io/cohort/ (HTTP 200 verified October 15, 2026; the Pages landing renders the project README until a dedicated demo page is pushed, as recorded in the portfolio tracker)

## Verification baseline (October 15, 2026)
- `npm test` from a clean state (no local data.json, the same state CI starts from): 7 of 7 tests pass locally (6 REST API tests plus 1 MCP protocol test: handshake, tool list with output schemas, and real tool calls)
- Repeat run defect, fixed October 15, 2026: reproduced first, a clean run passed 7 of 7 and a second `npm test` on the same local data.json failed 1 of 7, the upvote test getting 409 where it expected 200. Root cause in plain words: the server loads data.json at boot and saves every change to it, the upvote test votes with the fixed handle test_voter, and the suite never reset that file, so the vote from the first run was still recorded when the second run started and its first vote correctly conflicted. The application code was not at fault. What changed: the fix is in test/api.test.js only, plus this checklist record. Its before hook now moves any existing data.json aside before the server starts, so the server seeds a fresh fixture file, and its after hook waits for the server to exit, deletes the test run file, and restores the original data.json untouched (its hash was unchanged after each proof run). No assertion was weakened and the upvote test still expects 200 on the first vote and 409 on the second. Evidence: two consecutive `npm test` runs on the same working tree both passed 7 of 7, and a further run from a clean state (no data.json) also passed 7 of 7.
- Recorded agent session: test/evidence/mcp-session.json (agent message verified landed in the room)

## Upgrade queue (from the evolution strategy, in order)
Each item needs a short spec with a verify by line before a daily pass picks it up. Ranking follows the weakest measured area first.
- [x] Make the test suite repeatable on a dirty local data.json (isolated test state, not a unique voter handle), so `npm test` passes on repeat runs, not only from clean state. Found and fixed October 15, 2026, see verification baseline above for the root cause and the two consecutive passing runs as evidence.
- [ ] Agent task history in room state: let an agent see what it and other agents already did in a room, so multi session work has memory. Next capability upgrade.
- [ ] Auth model decision documented, then scoped agent identities for the MCP server
- [ ] Uptime demo instance, so the workspace itself (not only the Pages landing) is reachable without running a local server
- [ ] Session recordings beyond the committed MCP transcript

## Working agreements
- AGENTS.md in this repo governs how changes are made and proven here.
- Known limits, stated in the README and not hidden here: no accounts or auth yet, document sync is last write wins, and persistence is a single data.json file for one server process.
