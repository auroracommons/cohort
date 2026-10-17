# Cohort MCP demo walkthrough

First written by Wedajo Getachew (geyachewedajo-ops) in pull request #3, and landed on main with credit on October 17, 2026. The step list is theirs; step 6 was added the same day, because the evidence runner gained a task history read in the October 17, 2026 pass.

## Overview

This demo shows how an AI agent uses MCP to interact with Cohort projects. Run it with the server up (`node server.js` in one terminal, `npm run demo:mcp` in another). The full transcript of a run is saved as evidence, not described from memory.

## Steps

1. List projects: the agent requests a list of available projects. A human can see which projects are available to the agent.
2. Read project details: the agent reads project information, shared notes, and chat messages.
3. Post a message: the agent sends a message to the project's chat room. People with access to the room can see the message.
4. Verify the message: the agent reads the room again to confirm that the message appears.
5. Read the task history: the agent reads the room's activity log back through the `get_task_history` tool, to see its own post recorded in the history it plans from.
6. Save evidence: the demo saves the session to `test/evidence/mcp-session.json`.

## Result

The demo completed successfully. The output confirmed: "Agent message landed in room: true". This means the agent successfully posted the message and verified that it appeared in the project room. The current committed transcript also records `taskHistoryIncludesAgentPost: true`.
