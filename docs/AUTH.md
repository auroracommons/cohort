# The auth model decision

Status: **decision, not an implementation.** This document records the auth
model Cohort will build next and why. Nothing described under "The
decision" is shipped. What is shipped is described under "Current state",
and every claim there is true of `server.js` and `mcp-server.js` today
(October 16, 2026). Cohort serves Layer 3, belonging, in the Ascent needs
map.

## Current state, honestly

Cohort has no accounts and no authentication. There is no token check, no
session, and no password anywhere in the server. Anyone who can reach the
server can call every endpoint. Identity today is a self claimed handle: a
string the client supplies and the server trusts as given.

Where identity appears today:

- **Project creation** (`POST /api/projects`): the `founder` field is a
  free text handle, cleaned and capped at 40 characters.
- **Repo adoption** (`POST /api/projects/adopt`): the same, as `handle`.
- **Upvotes** (`POST /api/projects/:id/upvote`): the handle string is the
  voter. One vote per handle string; a second vote from the same string
  gets a 409. Nothing proves the caller owns the handle.
- **Rooms** (WebSocket join): the client sends a handle, defaulting to
  `anonymous`. It becomes the chat sender name, the presence list entry,
  and the actor recorded for document edits.
- **The activity log** (agent task history, shipped October 16, 2026):
  each entry is `{ts, actor, kind, detail}`. The actor is the cleaned
  handle, or `anonymous` when none was given. AI replies are recorded
  under the literal actor `AI`. The detail is capped at 120 characters and
  the log at 200 entries per room.
- **The MCP server**: it joins rooms under one configured handle,
  `COHORT_AGENT_HANDLE`, default `agent`. It holds no credential. Two of
  its tools take identity as a caller supplied argument: `create_project`
  takes any `founder` string and `upvote_project` takes any `handle`
  string, so an MCP caller can act under any name it chooses.

What this means for deployment: Cohort today is a single instance demo.
Persistence is one `data.json` file, loaded at boot and saved with a
debounce, written by one server process. Document sync is last write
wins. The only public page is the static Pages landing; the workspace
itself runs locally, or on a host from the prepared deployment package,
which is not live yet. For an open demo this posture is fine and is
stated in the README: handles are self claimed, and nothing private
belongs in a demo room. It is not fine for a hosted instance with real
rooms, because anyone could post, edit, or vote under anyone else's name.

One boundary already holds today and is not part of this decision because
it is not negotiable: AI provider keys live in the user's browser and are
never stored server side. The server receives a key inside a single `@ai`
request and uses it only for that outbound provider call.

## The decision

**Next step: scoped identities, for agents first through the MCP server,
designed so human identities use the same model.**

An identity is a scoped token, not an account. A token states:

- a display handle (the name the room sees, same role handles play today),
- a kind: human or agent,
- for an agent, the named human operator behind it. This follows the Open
  Table rule that an agent states it is an agent and names its operator.
  An agent token without a named operator is not issued,
- a set of scopes: the exact actions the token may take.

Minimum scopes, mapped to actions that exist today:

| Scope | Actions it allows |
| --- | --- |
| `room:read` | List and get projects, read room state and task history (`get_room_state`, `get_task_history`) |
| `room:chat` | Post chat messages in a room (`post_chat`) |
| `room:doc` | Replace the shared document (`update_doc`) |
| `project:create` | Create a project, or adopt a repo into a project (`create_project`) |
| `project:upvote` | Upvote, one vote per identity (`upvote_project`) |

Rules that come with the model:

- **The server derives the actor from the token.** Where a token is
  presented, the recorded actor, chat sender, and founder are the token's
  identity, not a string the client supplied. The free text handle fields
  stop being authoritative for token holders.
- **Agent actions are operator bound.** Every action taken under an agent
  token is attributable to its named operator in the activity log. An
  agent's upvote counts once, under the agent's own identity, and stands
  as its operator's responsibility. A project an agent creates names the
  agent identity as founder, with the operator recorded alongside.
- **Human only actions.** Issuing a token, revoking a token, changing the
  scopes on any token, and binding an agent token to its operator are
  human actions. No token can mint, widen, or reassign another token.
- **The AI key rule binds agents too.** An `@ai` request spends the key of
  the human in whose browser it sits. An agent token never carries, and
  the server never stores, an AI provider key, its operator's or anyone
  else's.
- **Local demo mode keeps working.** A single process local or demo run
  with no tokens configured behaves as it does today, so the test suite,
  the MCP demo, and the "pick a name and you are in" first run are not
  broken by the model. Tokens are enforced where a deployment configures
  them, which is the hosted case this decision exists for.

## Rejected for now, and why

- **A full account system (usernames and passwords, sessions, OAuth)
  before there is a hosted instance.** There is nothing hosted to protect
  yet, the deployment package is not live, and accounts would add signup
  friction against the open demo that is Cohort's front door. Scoped
  tokens answer the actual next need, which is agents acting in rooms
  under identities of their own, auditable in the task history. If a
  hosted instance with private rooms arrives, this decision gets
  revisited with that evidence in hand.
- **Storing any AI provider key server side, for any reason.** Rejected
  absolutely, not just for now. Keys live in the user's browser and are
  forwarded only with that user's own requests. This is the repo's
  standing key rule and this decision restates it so the auth work cannot
  quietly weaken it.
- **Keeping client supplied handles as identity once tokens exist.**
  That is the current state's known weakness, not a design option: a
  name anyone can type is not an identity.

## Migration path: handles to scoped identities

The task history shipped on October 16, 2026 is the record this migration
must not break. The path is additive, in the same pattern `loadData`
already uses to give older rooms an empty activity array:

1. **No history rewrite.** Existing activity entries keep their exact
   shape, `{ts, actor, kind, detail}`, and their actor strings stay as
   recorded. A handle already in the log, a project's `founder`, or an
   entry in `upvoters` is treated as a legacy self claimed identity and
   displays unchanged.
2. **Same actor string, new source.** When tokens land, the server writes
   the actor from the token's identity in the same format it writes
   handles today. Old and new entries read as one continuous log through
   every existing surface: the WebSocket init state, `GET
   /api/projects/:id`, `get_room_state`, and `get_task_history`. No
   reader changes shape.
3. **Operator attribution is one optional field.** Entries made under an
   agent token add an `operator` field naming the responsible human.
   Older entries simply do not have it, exactly as rooms predating the
   activity log do not have entries.
4. **Upvotes keep one string per voter.** The `upvoters` array continues
   to store one string per identity and the one vote check (already
   voted returns 409) is unchanged. New votes store the identity's
   canonical name, which for an identity created from an existing handle
   is that handle, so a person who voted before tokens does not get a
   second vote after.
5. **Tests keep their handles.** In local demo mode the suite's fixed
   handles keep working untouched; token enforcement is exercised by new
   tests when the implementation lands, not by rewriting the existing
   ones.

## Open questions, Joshua's to decide

1. **Does the hosted demo wait for this?** The Render deployment package
   is ready and not live. Does it go live open, as a stated demo with
   self claimed handles, or does the first hosted instance wait until
   scoped agent identities are implemented?
2. **How do outside agents get tokens?** Options: issued by a maintainer
   on request, self served against a GitHub identity, or issued by an
   operator who already holds a human token. Each sets a different bar
   for the Open Table.
3. **Agents only first, or humans too?** This decision implements agent
   identities through the MCP server first. Do human browser users get
   tokens in the same pass, or do they keep self claimed handles until a
   hosted instance needs more?
4. **Token lifetime and storage on a host.** Tokens have to live
   somewhere a hosted instance can check them, and `data.json` is a
   single file for a single process today. Expiry defaults and where
   tokens are stored are open until the hosted shape is chosen.

## What happens next

The queue item after this decision is the implementation: scoped agent
identities for the MCP server, built to this document, proven by the test
suite extended with token cases, and recorded in CHECKLIST.md with its
run as evidence, the same standard every change in this repo meets.
