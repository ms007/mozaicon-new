# TASK

Review branch **{{BRANCH}}** for issue #{{ISSUE_NUMBER}}: {{ISSUE_TITLE}}.

Preserve behaviour exactly — change **how** the code does things, never **what**.

# CONTEXT

<issue>

!`gh issue view {{ISSUE_NUMBER}} --json number,title,body,labels`

</issue>

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

<diff-against-feature>

!`git diff {{FEATURE_BRANCH}}..HEAD`

</diff-against-feature>

# STANDARDS

Authoritative:

- `@.sandcastle/CODING_STANDARDS.md` — test quality, mocking boundaries, interface design.
- `CLAUDE.md` — architecture, conventions, Definition of Done.

Read them before reviewing.

# REVIEW PROCESS

## 1. Read the diff for anything dodgy

Fragile logic, unchecked assumptions, implicit coercions, missing guards,
optional params with silent defaults. For every suspect spot, **write a test
that tries to break it**. If you break it, fix it.

## 2. Stress edge cases

For each changed code path:

- Empty / zero / negative / `null` / `undefined` inputs.
- Rapid repeated calls, state mutating mid-operation.
- Off-by-one in loops, slices, coordinate math.
- **Mozaicon-specific:** multi-selection, undo/redo round-trip, SVG
  serialize → parse → serialize stability.

Write tests for anything not yet covered.

## 3. Test quality

Apply CODING_STANDARDS aggressively — this is the review phase's leverage:

- Are tests asserting on observable state, or on internal call wiring?
- Any mocked internal collaborators? Rework them around a real `createStore()`.
- Any snapshots of React trees? Replace with explicit assertions (or an SVG
  golden file if that's what's actually being checked).
- Any test name that describes HOW, not WHAT? Rename or rewrite.

## 4. Code quality

- Reduce nesting and unnecessary complexity.
- Eliminate redundant abstractions.
- Clearer names > clever names.
- Prefer `switch` / early return over nested ternaries.
- Remove JSDoc on trivially-named functions.
- Scrutinize optional params — every `?:` is a bug path.
- Prefer deep modules; consolidate shallow wrappers.

## 5. Don't over-simplify

Keep helpful abstractions. Don't merge concerns just to cut lines. Clarity
beats brevity.

# EXECUTION

1. `pnpm check` — confirm green baseline.
2. Write tests that try to break the code. Fix what breaks.
3. Refine code quality directly on this branch.
4. `pnpm check` again — nothing regresses.
5. If you changed anything, one commit:
   - `refactor:` for behaviour-preserving code changes.
   - `test:` if you only added tests.
   - Body: `Refs #{{ISSUE_NUMBER}}`.

If the code is already clean, well-tested, and edge-case-safe: **do nothing.
No commit.**

Do not push. Do not close the issue.

# DONE

Output `<promise>COMPLETE</promise>` when finished.
