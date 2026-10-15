# Contributing to Cohort

Contributions are welcome, and the door is kept visibly open: there is
always at least one good first issue available. The house rule is the
evidence rule: a contribution ships with the run that proves it (the test
output, the session transcript), not just the code.

## Setup

```bash
npm install
node server.js    # the workspace, on http://localhost:3000
npm test          # REST API tests plus MCP protocol tests
```

## Good first issues (sized in hours)

- **Add a REST API test (1 to 2 hours).** Pick an endpoint behavior not yet
  covered in `test/api.test.js` (the news and open source proxies are the
  obvious gaps), and add a test in the existing style.
- **Add an MCP tool description example (about an hour).** The tools in
  `mcp-server.js` are described in prose. Pick one tool and add a worked
  example call and response to its description, verified against a live
  server.
- **Record a demo session (1 to 2 hours).** Run `npm run demo:mcp` against
  a fresh server, review the transcript in `test/evidence/`, and write the
  short walkthrough of what the agent did that the repo currently lacks.
- **File a sync edge case (under an hour).** Document sync is last write
  wins. Reproduce a two editor overwrite, describe it precisely in an
  issue, and note what a CRDT would need to preserve. Diagnosis is a
  contribution.

## Ground rules

- The AI key rule is absolute: keys live in the user's browser and are
  never stored server side. A PR that weakens this does not merge.
- The MCP server must stay a real client of the workspace (REST plus
  WebSocket), never a direct reader of `data.json`.
- Input limits exist on every field. New endpoints get limits in the same
  change that adds them.

## Pull requests

Keep them small and single purpose. State the evidence in the PR
description: what you ran and what it showed. Contributors are named in
release notes.
