# Vekro Frontend

Web app for Vekro, an escrow trust layer for Kenyan social-commerce sellers. Buyers pay into escrow through a seller's Trust Link; funds are released only after the buyer inspects and accepts the item.

Backend: [CKmellow/Vekro-backend](https://github.com/CKmellow/Vekro-backend). Delivery is tracked on the [Vekro Frontend Delivery Board](https://github.com/users/CKmellow/projects/2).

Work happens in issues, one branch per issue, merged into `main` through pull requests.

## Getting started

After cloning, enable the repo's git hooks once:

```sh
git config core.hooksPath .githooks
```

The `commit-msg` hook rejects co-author trailers and AI attribution lines.

## Agent setup

- `CLAUDE.md` holds the standing rules for coding agents.
- Design and UI skills live in `.agents/skills/` (pinned in `skills-lock.json`) and are exposed to Claude Code through `.claude/skills/`.
- `.vscode/mcp.json` connects VS Code to the Stitch MCP server. The API key is prompted for, never committed.
