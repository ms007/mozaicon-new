---
name: implement-issue
description: Autonomously implement the work for the current issue branch — reads the issue body and comments, writes code and tests, iterates until all acceptance criteria are met and `pnpm check` is green. Use when the user wants to implement an issue they've already started.
---

# Implement Issue

Autonomous implementation loop for the current issue branch. No argument — issue number is derived from the branch name.

Completion means: AC + Definition of Done from `CLAUDE.md` are met, working tree is dirty with green checks, ready for `ship-issue`. No commit here.

## Process

### 1. Preflight

```bash
BRANCH=$(git branch --show-current)
```

The branch must match `^(feat|fix|chore)/issue-([0-9]+)-`. If not, abort: "Run `/start-issue <N>` first."

Extract issue number from the branch name.

```bash
gh auth status
```

Resolve Project v2 per the shared mechanic documented in `start-issue/SKILL.md`. Abort if not resolvable.

### 2. Load context (fresh every run)

```bash
gh issue view <N> --json title,body,comments,labels
git diff --name-only $(git config branch.$BRANCH.base || echo main)...HEAD

# If an open PR exists for this branch, pull its discussion comments too
PR_NUMBER=$(gh pr list --head "$BRANCH" --state open --json number --jq '.[0].number')
if [ -n "$PR_NUMBER" ]; then
  gh pr view "$PR_NUMBER" --json comments
fi
```

Read:

- Issue `body` — extract `## What to build`, `## Acceptance criteria`.
- Issue `comments` in chronological order — treat every comment as potential new requirements, corrections, or clarifications.
- **PR discussion comments** (if a PR exists) — same treatment as issue comments. Merge both streams by `createdAt` so the combined timeline reads naturally. Zeilengebundene PR-Review-Comments (`/pulls/:n/comments`) werden **nicht** gelesen — schreib Code-Feedback als Discussion-Comment auf den PR oder als Issue-Kommentar.
- `CLAUDE.md` Definition of Done section.
- Deep-dive docs **only if relevant** to the slice:
  - Anything in `src/store/` or `src/features/canvas/` → read `docs/architecture.md`.
  - Shape type changes (`src/types/shapes.ts`, new renderer/tool/editor) → read `docs/shapes.md`.
  - New tests → read `docs/testing.md`.

On re-entry (diff against base is non-empty): reconcile what's already done against AC. Identify the remaining work, including anything new from comments added since the last run.

### 3. Work autonomously

Rules for the work loop:

- Subagents are allowed — `Explore` for unfamiliar code paths, `Plan` for architectural turns. Don't spawn them for trivial slices.
- Never manipulate the SVG DOM imperatively. Never bypass the command pattern (see `CLAUDE.md`).
- Keep the slice thin — you're implementing exactly what this issue describes, nothing more.
- After each meaningful set of changes run `pnpm check`.

`pnpm check` loop:

1. Run `pnpm check`.
2. Red → read the error, fix, re-run once.
3. Still red after 2 attempts → stop. Do not attempt a third auto-fix. Jump to step 5 (escalation).

### 4. Verify completion

All of these must hold before exiting:

- [ ] Every AC in the issue body is implemented.
- [ ] Every additional AC from issue comments is implemented.
- [ ] `pnpm check` is green.
- [ ] New logic has tests (Vitest unit for `lib/`, component tests where non-trivial, Playwright for canvas/e2e flows).
- [ ] No new TypeScript errors, no new ESLint warnings.
- [ ] If the slice touches SVG export: `pnpm test src/features/export/export.test.ts` still green.

If any box can't be ticked and the gap isn't blockable by user input, keep working (step 3). Otherwise, escalate (step 5).

### 5. Escalation (hard pause)

Trigger on any of:

- AC is contradictory or unclear.
- Schema / API change required that isn't in the issue.
- `pnpm check` red after 2 attempts.
- A completion-criterion box stays unchecked and you don't know how to close it.

Action:

1. Write **one** comment to the issue capturing current state so the next `/start-issue` or `/implement-issue` re-entry has context:

   ```bash
   gh issue comment <N> --body "$(cat <<'EOF'
   **Implementation paused** — <one-line reason>

   **Done**
   - <bullet>

   **Open**
   - <bullet>

   **Needs input**
   - <bullet>
   EOF
   )"
   ```

2. Stop. Summarise in German to the user with the same content and ask what to do.

Do not commit. Do not push. Do not change status.

### 6. Exit on success

Working tree stays dirty. Status stays `In Progress` (unchanged). Output a German summary:

```
## Fertig implementiert — bereit für /ship-issue

**Geändert**
- <file>: <one-line what>

**AC-Coverage**
- [x] <AC 1> — Test: <test file>
- [x] <AC 2> — Code-Pfad: <function>
- [ ] <AC 3> — nicht auto-verifizierbar: <reason>

**Nächster Schritt**: /ship-issue
```

AC checkboxes here follow the same rule as in the PR body later: tick only what you can point to a test or traceable code path for. Unverified ones stay open — `ship-issue` will carry them through to the PR body unchecked.

## Rules

- No commits. No pushes. No PR. No status changes.
- Never skip `pnpm check`.
- Never `--no-verify` a hook, never `@ts-ignore` without a comment explaining why (and prefer fixing the underlying issue).
- Follow every convention in `CLAUDE.md` — strict types, command pattern for mutations, atoms for state, files < 300 lines, one component per file.
- German for user-facing output; English for code, comments, tests, and the issue comment on escalation.
