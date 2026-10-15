# AGENTS.md

Working agreement for any agent changing this repo. Read this first, then README.md and CONTRIBUTING.md.

## What this is
Cohort: a community learning platform where people and AI agents share rooms. The MCP server joins as a real client of the workspace API, never as a direct reader of the data file.

## Commands
- Install: `npm ci`
- Server: `node server.js` (port 3000)
- Test: `npm test`
- MCP live session demo: `npm run demo:mcp` (start the server first; the demo talks to it and writes its transcript to `test/evidence/`)
- CI runs the API tests, then starts the server and runs the MCP demo, on every push

## House rules
- Evidence rule: a change ships with the run that proves it (test output, a session transcript), never code alone.
- Honesty rule: README claims trace to artifacts in this repo. If a run did not happen, the claim does not get written.
- One improvement per pass. Finish it, prove it, commit it.
- No placeholders. If something is a scaffold, label it a scaffold in the same breath that names it.
- The AI key rule is absolute: keys live in the user's browser and are never stored server side. A change that weakens this does not merge.
- Input limits exist on every field. New endpoints get limits in the same change that adds them.
