# TASK

Implement GitHub issue #{{ISSUE_NUMBER}}: {{ISSUE_TITLE}}

You are on branch **{{BRANCH}}**, freshly cut from **{{FEATURE_BRANCH}}**.
Work only on this one issue — no scope creep, no neighbouring fixes.

The orchestrator will push, merge, and close. You don't.

# ISSUE CONTEXT

<issue>

!`gh issue view {{ISSUE_NUMBER}} --json number,title,body,labels,comments`

</issue>

<prd>

!`gh issue view {{PRD_NUMBER}} --json number,title,body`

</prd>

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

<diff-against-feature>

!`git diff {{FEATURE_BRANCH}}..HEAD --stat`

</diff-against-feature>

# STANDARDS

Authoritative:

- `CLAUDE.md` — architecture, conventions, **Definition of Done**.
- `@.sandcastle/CODING_STANDARDS.md` — test quality, mocking boundaries, interface design.
- Deep-dives as relevant: `docs/architecture.md`, `docs/shapes.md`, `docs/testing.md`, `docs/ui-primitives.md`.

Read them before coding. Don't re-state them here.

# EXECUTION

1. **Understand.** Read the issue body, every comment, and the PRD. Extract
   the Acceptance Criteria verbatim.
2. **Explore.** Grep the affected area. Reuse before you write.
3. **RGR vertical slices.** One test → one impl → repeat. Never refactor
   while RED. (See CODING_STANDARDS → TDD.)
4. **Feedback loop:** `pnpm check` after each meaningful step.
   - Red → read, fix, re-run.
   - Still red after 2 auto-fix attempts → escalate. Do not attempt a third.

# COMMIT — EXACTLY ONE

Conventional Commits. Pick the type from issue labels (first match wins,
case-insensitive):

- `bug` | `fix` → `fix:`
- `chore` → `chore:`
- else → `feat:`

Title: issue title stripped of any existing prefix, first word lowercased.
Body: `Refs #{{ISSUE_NUMBER}}`.

```
feat: add circle shape tool

Refs #42
```

Do not push. Do not close the issue. Do not amend.

# ESCALATION

Trigger on any of:

- Acceptance Criteria contradictory or unclear.
- Schema / API change needed that isn't in the issue.
- `pnpm check` still red after 2 auto-fix attempts.
- You can't tick a Definition-of-Done box and don't know how.

Action — leave **one** comment, then stop:

```bash
gh issue comment {{ISSUE_NUMBER}} --body "$(cat <<'EOF'
**Implementation paused** — <one-line reason>

**Done:** <bullets>
**Open:** <bullets>
**Needs input:** <bullets>
EOF
)"
```

No commit. Output `<promise>COMPLETE</promise>` so the orchestrator records
the slice as attempted-but-unresolved.

# DONE

Output `<promise>COMPLETE</promise>` when the commit exists and `pnpm check`
is green (or when you've escalated).
