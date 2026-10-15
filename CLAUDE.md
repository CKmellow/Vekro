# Vekro Frontend

Web app for Vekro, an escrow trust layer for Kenyan social-commerce sellers. A seller lists an item and shares a Trust Link; the buyer pays by M-Pesa into escrow locked to that one transaction; money moves only on button presses or timeouts. Actors: Buyer, Seller, Admin (the courier is not a system actor).

Never design, build or suggest: AI or photo comparison, geofencing, multi-sig, blockchain, crypto, wallets, courier tracking, photo evidence for disputes.

## Authorship (absolute)

- Cyprian (`CKmellow`) is the only author, committer and contributor.
- No `Co-authored-by` trailers, no "Generated with" lines, no AI collaborators, assignees or reviewers, in commits, PRs, issues, comments or docs. Assign issues and PRs to `CKmellow`.
- Never change the git identity. `.githooks/commit-msg` enforces this; run `git config core.hooksPath .githooks` once per clone.

## Session start

1. Read `LOCAL_EXECUTION_PLAN.md` (local only): the current milestone, issue and next items.
2. Read `docs/COPILOT_PROMPT.md` (local only), the full operating prompt.
3. `git checkout main && git pull`. Continue the plan's active item. Do not start a new issue until Cyprian says `next`.

## Sources of truth (priority order)

1. `docs/FRONTEND_CONTRACT.md`: decisions that override PAGES.md (buyer entry, payment instruction, B4 code entry).
2. `docs/PAGES.md` (local only): behaviour, layout, controls, states and copy for all 30 screens. Read its "Deviations" section.
3. `.stitch/DESIGN.md` (local only): colours, fonts, shapes, components, motion, voice.
4. `api/openapi.json`: the only API contract, copied from CKmellow/Vekro-backend. Never invent endpoints or fields; never edit the backend repo.
5. `design/`: approved Stitch exports.

Missing API capability: open a `backend-gap` issue, mock it with MSW behind `src/models/api/adapters/`, tag it `// backend-gap #<n>`, flag it with `VITE_MOCK_<GAP>`, and list it in `docs/BACKEND_GAPS.md`.

The backend `TransactionStatus` enum is the authority. `STATE_META` maps every value to human labels (never show raw state names). `dispatched` is legacy; `resolved_refund` shows as "Refund issued", `resolved_release` as "Complete", `resolved_split` as "Settled by Vekro support".

## Workflow

- Milestones: `Milestone N - Title`. Issues: `[M<N>] <title>`. Backend gaps: `[backend-gap] <id>: <title>`.
- One issue, one branch from `main`: `m<N>-issue-<number>-<slug>`. PR title `[M<N>][#<number>] <title>`, body from the PR template with `Closes #<number>`, milestone, project and assignee set.
- Conventional Commits mentioning the issue. Build PRs stay under about 400 changed lines; design PRs batch up to three pages.
- One open PR at a time. Never merge, never push to `main`. Cyprian squash-merges.
- Board (project #2): Backlog, Ready, In progress (branch created), In review (PR open), Blocked, Done (merged).
- After a merge: pull `main`, update `LOCAL_EXECUTION_PLAN.md`, report, and wait for `next`.

## Design (Stitch)

One Stitch project, "Vekro", with DESIGN.md applied. Brief with enhance-prompt, generate, self-review against `docs/DESIGN_REVIEW_CHECKLIST.md`, audit with web-design-guidelines, at most two edit passes, export to `design/<ID>-<slug>/` and update `design/INDEX.md`. Never regenerate an approved screen; never print or commit the Stitch key. Skill precedence: FRONTEND_CONTRACT, then PAGES and DESIGN, then taste-design and frontend-design, then ui-ux-pro-max, then the Vercel guidelines (which win on accessibility and performance only).

## Build stack and MVC

React, Vite, TypeScript strict, Tailwind with tokens generated from DESIGN.md and committed, React Router, shadcn/ui (Radix), motion, TanStack Query, React Hook Form with Zod, openapi-typescript, Vitest, RTL, MSW, Playwright, vite-plugin-pwa, lucide-react, Recharts, qrcode.react, date-fns (Africa/Nairobi). No Redux. No other libraries without asking.

```
src/app          router, providers, guards, error boundary
src/models       api (types, client, adapters), schemas, domain (STATE_META, getAvailableActions, deadlines), queries
src/controllers  one hook per screen: queries, mutations, validation, polling; no JSX
src/views        pages, components, layouts: props and callbacks only, no models, no fetch
src/lib          money, phone, time, copy
src/styles       generated tokens
src/mocks        MSW (tests and backend gaps only)
```

- Sessions are server-side cookies with CSRF; `credentials: "include"` and the CSRF header on unsafe methods. No JWT, nothing in browser storage.
- 401 goes to login with a return URL, 403 to a friendly page, 409 refetches and toasts, 422 shows field errors, network failure shows a banner.
- Countdowns use server deadlines, never the device clock. Poll payment every 3s up to 90s; poll the tracker every 15s while active.
- Mask phones except in the admin console. No PII in logs. Respect `prefers-reduced-motion`.

## Definition of done

Acceptance criteria ticked; matches the approved design; tokens only; loading, empty, error and offline states; keyboard, screen-reader and contrast basics; tests for logic and views; `npm run lint`, `typecheck`, `test` and `build` pass locally and in CI; no secrets, tokens or PII committed; screenshots in UI PRs; no AI attribution.
