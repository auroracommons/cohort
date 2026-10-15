<style>
.commons-bar{font:inherit;padding:1em 0;line-height:2}
.commons-bar a,.commons-bar span{margin-right:1rem}
.commons-bar span{font-weight:700}
.commons-footer{margin-top:3em;font:inherit;line-height:1.6}
</style>
<nav class="commons-bar" aria-label="Aurora Commons sites">
  <a href="https://auroracommons.github.io/auroracommons/">Aurora Commons</a>
  <a href="https://auroracommons.github.io/auroracommons/foundations.html">Foundations</a>
  <a href="https://auroracommons.github.io/ground/">Ground</a>
  <a href="https://auroracommons.github.io/still/">Still</a>
  <a href="https://auroracommons.github.io/atlas/">Atlas</a>
  <span aria-current="page">Cohort</span>
  <a href="https://auroracommons.github.io/graph/">Graph</a>
  <a href="https://auroracommons.github.io/machine/">Machine</a>
  <a href="https://auroracommons.github.io/lumen/">Lumen</a>
</nav>

# Cohort

**Find your cohort. Build your company.**

What runs today: a community platform in this repo, with a projects board, shared rooms, and a live workspace, whose MCP server joins as a real client. A recorded live agent session transcript is committed here as the receipt, and the test suite passes 7 of 7.

Cohort is the open-source, community-driven online Y Combinator. Great companies
start with the right people in the same room. Cohort makes that room the
internet. Builders from anywhere meet here, pitch what they want to make, form
teams around shared conviction, and start working immediately in a live,
collaborative workspace with an AI co-builder sitting in the group chat. No
applications, no gatekeepers, no equity taken: the accelerator is the
community itself, and the whole thing is MIT-licensed so anyone can run,
fork, and improve it.

## The need

This repo serves Layer 3: Belonging.

"People who know your name. A room where your work is seen. A first believer when you are starting from nothing." Cohort makes that room the internet, where builders meet, form teams, and start working together in a live workspace.

Unmet, it looks like: loneliness at scale, builders and neighbors invisible to each other, communities that exist only as audiences for someone else's platform.

The full map: [The Ascent, a map of human needs](https://github.com/auroracommons/auroracommons/blob/main/NEEDS.md)

## What it is

### Features

- **Projects board:** pitch an idea in one breath, tag the roles you're
  looking for, and let the community find you.
- **Real-time workspace:** every project gets a shared live-editing document
  and a group chat, synced over WebSockets.
- **AI co-builder:** bring your own API key (Gemini, Groq, OpenRouter,
  Anthropic, or any OpenAI-compatible endpoint) and prompt the AI together
  with your cofounders using `@ai` in chat. Replies go to the whole room.
- **Upvotes and leaderboard:** back the projects you believe in; the best rise.
- **Live Hacker News feed:** the top 30 stories, proxied and cached
  server-side, so the community stays plugged into the ecosystem.

### Quickstart

```bash
npm install
node server.js
```

Then open [http://localhost:3000](http://localhost:3000).

State lives in a single `data.json` file next to the server (auto-created and
seeded with demo projects on first boot; gitignored).

### Architecture

The whole server is one file, `server.js` (about 600 lines, Express plus the
`ws` WebSocket library), and that is a deliberate choice: the project is small
enough that one readable file beats a framework. It serves:

- A REST API for projects: list, create, adopt, and upvote, with input length
  limits enforced on every field.
- WebSocket rooms, one per project, carrying the shared document and the room
  chat. Document sync is last write wins (see limitations below).
- An `@ai` chat endpoint that proxies to whichever provider the user
  configured, using the user's own key.
- Cached proxies for the Hacker News and open-source feeds, so the board
  stays fast and the upstream APIs stay unhammered.

Persistence is a single `data.json` with debounced saves. It is honest
single-instance storage: run one server process and it is exactly right;
run five and it is exactly wrong. For a community tool at this scale, that
trade is stated rather than hidden.

### Agents welcome: the MCP server

Cohort ships an MCP server (`mcp-server.js`) that lets an external AI agent
work in a room alongside the humans. It is a real client of the workspace,
not a backdoor: it reads projects through the REST API and joins rooms over
WebSocket under its own handle (`agent` by default), so everything it does
is visible in the room. Seven tools: list and get projects, read full room
state (project, shared document, recent chat, presence) in one call, post
chat, update the document, create a project, upvote. Every tool declares an
output schema and returns structured content an agent can plan over, and
errors come back with machine readable codes.

Verified like everything else here: the automated suite (`npm test`, 7
tests) drives the MCP server over stdio through a real handshake and tool
calls, and a recorded session transcript lives at
`test/evidence/mcp-session.json`. Run it yourself:

```bash
node server.js          # in one terminal
npm run demo:mcp        # records a fresh session transcript
```

### Bring your own AI key

Cohort never stores your AI key on the server. It lives in your browser's
localStorage and is forwarded only with your own `@ai` requests, used
transiently for the outbound provider call. Configure it via **AI Settings**
in the top nav.

| Provider   | Free tier (approx.)   | Get a key                                                |
| ---------- | --------------------- | -------------------------------------------------------- |
| Gemini     | ~1,500 requests/day   | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Groq       | ~1,000 requests/day   | [console.groq.com](https://console.groq.com)             |
| OpenRouter | free-tier models      | [openrouter.ai](https://openrouter.ai)                    |
| Anthropic  | pay-as-you-go         | [console.anthropic.com](https://console.anthropic.com)    |

Any OpenAI-compatible endpoint also works via the **Custom base URL** provider.

### Roadmap

- **Agent task history in room state (planned).** Let an agent see what it
  and other agents already did in a room, so multi session work has memory.
- **Scoped agent identities (planned).** The MCP server currently acts under
  one configured handle because Cohort has no auth model yet. When it gets
  one, agents get identities of their own, scoped and auditable. This is
  the same authorization problem the wider MCP field is working on; see
  `docs/LANDSCAPE.md`.
- **Yjs CRDT editor:** replace the naive last-write-wins textarea sync with
  real conflict-free collaborative editing.
- **CodeMirror:** syntax highlighting and a proper editing surface in the
  shared workspace.
- **Founder profiles:** skills, timezone, track record, past cohorts.
- **Demo days:** scheduled community showcases with live voting.
- **Age-gated tracks:** a safe, moderated track for young builders.

### The larger story

Cohort is Act 2, the Commons, in a five part body of work built on one
thesis: technology should increase human capability without taking human
agency away. The problem family this act serves is collective action and
coordination failure: good people with good ideas who never find each
other. The other acts:

- Act 1, the Atlas: [atlas](https://github.com/auroracommons/atlas), how people learn.
- Act 3, the Machine: [machine](https://github.com/auroracommons/machine), how the machine itself learns, from first principles.
- Act 4, the Graph: [graph](https://github.com/auroracommons/graph), how knowledge connects and can be questioned.
- Act 5, the Guardrails: [lumen](https://github.com/auroracommons/lumen), how all of it stays safe, cited, and human governed.

The north star metric for this act, counted honestly once the commons is
live and dated when reported: **builders who shipped something real in a
cohort room**. No number is claimed yet, because there are no public rooms
yet. Ways to take part, including sized tasks for partners and
contributors, are in [COLLABORATE.md](COLLABORATE.md) and
[CONTRIBUTING.md](CONTRIBUTING.md).

The frame for the whole portfolio, stated as aspiration and direction,
never as achievement: the first AI wave automated tasks; what follows it,
if people build it deliberately, is a renaissance of human capability.
This repo is one small working exhibit of that direction, built in public
and measured in public.

## The proof

### Status and known limitations

Working and verified: the server boots clean, the projects API returns the
seeded board, workspaces sync in real time, the AI co-builder works with
any of the providers below, the MCP server passes its protocol tests, and
the REST API is covered by automated tests. Known limitations, stated plainly:

- **No accounts or auth.** Handles are self claimed. Fine for an open
  community demo, not fine for anything private.
- **Document sync is last write wins.** Two people typing in the same
  paragraph at the same moment can overwrite each other. A CRDT editor is
  the first item on the roadmap.
- **Single instance persistence.** `data.json` will not survive a
  multi-instance host. A real database is the obvious next step when a
  deployment outgrows one process.

## Live demo

Live demo: [https://auroracommons.github.io/cohort/](https://auroracommons.github.io/cohort/)

## Contribute, human or agent

Pick a good first issue in this repo, sized in hours and written to be finishable by a newcomer.
Take the Eval Challenge against this repo's published session and test results, and submit your run.
Report adoption from real use, good or bad, with evidence of what happened.

The full protocol: [The Open Table](https://github.com/auroracommons/auroracommons/blob/main/OPEN_TABLE.md). Verified work is credited in the public [Ledger](https://github.com/auroracommons/auroracommons/blob/main/LEDGER.md).

### Start with a prompt

Prompt A, for an AI agent:

```
You are an AI agent taking the Eval Challenge in the cohort repo.
Start from a clean state with no local data.json, then run npm ci and npm test.
Compare your result with the published baseline: seven tests pass out of seven, made of six REST API tests plus one MCP protocol test, and the MCP server offers seven tools.
Then start the server with node server.js and run npm run demo:mcp, and compare the fresh transcript with the recorded session at test/evidence/mcp-session.json.
Attach the full run to your submission, keep to one improvement per pull request, state that you are an agent, and name your operator.
```

Prompt B, for a human:

```
File a failure report using the failure report template in this repo.
Include the input you used, what happened, and what should have happened.
Attach the run, transcript, or output that shows the failure, if you have one.
```

## License

MIT. See [LICENSE](LICENSE). Copyright (c) 2026 Cohort contributors.

## Built on the shoulders of giants

[Express](https://expressjs.com), [ws](https://github.com/websockets/ws),
[Hacker News API](https://github.com/HackerNews/API) (Y Combinator),
the OpenAI-compatible chat completions convention adopted by
Google, Groq and OpenRouter, and the Y Combinator ethos of
*make something people want*, which this project tries to give away for free.

<p>The layer below: <a href="https://auroracommons.github.io/atlas/">Atlas, learning</a></p>
<p>The layer above: <a href="https://auroracommons.github.io/graph/">Graph, shared truth</a></p>
<p>The research under this layer: <a href="https://auroracommons.github.io/auroracommons/foundations.html#belonging-and-social-connection">Foundations, Belonging and social connection</a></p>
<footer class="commons-footer">
  <p>One rule: raise the floor beneath everyone.</p>
  <p>Advised by Groundskeeper.</p>
  <p><a href="https://www.linkedin.com/company/aurora-commons-io/">Aurora Commons on LinkedIn</a></p>
</footer>
