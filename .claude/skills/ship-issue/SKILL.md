---
name: ship-issue
description: Ship the current issue branch — optionally runs /simplify on the diff, commits with a Conventional Commits message, pushes, opens a PR against the recorded base branch, and sets Project v2 status to "In Review". Use when the user is ready to open a PR for the current issue.
---

# Ship Issue

Close out an implemented issue: polish → commit → push → PR → status.

No argument. Issue number is derived from the branch name. Optional flag:

- `--no-simplify` — skip the `/simplify` pass.

## Process

### 1. Preflight

```bash
BRANCH=$(git branch --show-current)
```

Branch must match `^(feat|fix|chore)/issue-([0-9]+)-`. Extract issue number and type prefix.

```bash
gh auth status
```

Resolve Project v2 per the shared mechanic in `start-issue/SKILL.md`. Abort if not resolvable.

Do **not** re-run `pnpm check` — `implement-issue` already gated on it. CI is the second line of defence.

### 2. Resolve PR base

```bash
BASE=$(git config branch."$BRANCH".base 2>/dev/null || echo main)
```

If `BASE` isn't `main`, verify the branch still exists locally or on origin:

```bash
git rev-parse --verify "refs/heads/$BASE" 2>/dev/null \
  || git rev-parse --verify "refs/remotes/origin/$BASE" 2>/dev/null
```

Neither exists → the parent got merged and deleted. Fall back to `main` and inform the user ("Parent-Branch `<base>` existiert nicht mehr — PR geht gegen `main`.").

### 3. `/simplify` pass (unless `--no-simplify`)

Invoke the `simplify` skill targeted at the current diff vs. base. Any changes it makes are included in the single commit below.

### 4. Commit

Skip if working tree is clean (re-run scenario after push+PR already happened in a previous session).

Type prefix from branch prefix:

- `feat/…` → `feat:`
- `fix/…` → `fix:`
- `chore/…` → `chore:`

Title: take the issue title, strip any existing type prefix, lowercase the first word.

```bash
git add -A
git commit -m "$(cat <<'EOF'
<type>: <cleaned issue title>

Refs #<N>
EOF
)"
```

No `Co-Authored-By`, no tool-signature footer. Commit looks identical to a manual one.

### 5. Push

```bash
git push -u origin "$BRANCH"
```

### 6. Existing PR check

```bash
gh pr list --head "$BRANCH" --state open --json number,url
```

Non-empty → skip PR creation, reuse the first URL, note "PR already existed — updated with new push."

### 7. Open PR

Extract AC from the issue body. For each AC, tick it **only** if you can point to a concrete test file or code path that implements it — otherwise leave it unchecked. This is the honest-signal rule.

```bash
gh pr create \
  --base "$BASE" \
  --head "$BRANCH" \
  --title "<type>: <cleaned issue title>" \
  --body "$(cat <<'EOF'
## Summary
- <1–3 bullets from the issue's "## What to build">

## Acceptance criteria
- [x] <AC verified>
- [ ] <AC not auto-verified>

## Test plan
- <new/changed tests>
- <manual verification steps>

Closes #<N>
EOF
)"
```

Capture the returned PR URL.

### 8. Status update

Fetch the issue's project item id (see shared mechanic in `start-issue/SKILL.md`), then:

```bash
gh api graphql -f query='
mutation($project:ID!,$item:ID!,$field:ID!,$option:String!){
  updateProjectV2ItemFieldValue(input:{
    projectId:$project,itemId:$item,fieldId:$field,
    value:{ singleSelectOptionId:$option }
  }){ projectV2Item{ id } }
}' -f project=<PROJECT_ID> -f item=<ITEM_ID> \
     -f field=<STATUS_FIELD_ID> -f option=<IN_REVIEW_OPTION_ID>
```

Do **not** touch `Done`. That happens automatically when the PR merges and GitHub closes the issue via `Closes #N` — your Project automation (if any) handles the transition.

### 9. Output

German, short:

```
## Shipped — PR offen

<PR URL>

**Base**: <base branch>
**Status**: In Review
```

## Rules

- No `pnpm check` re-run — trust `implement-issue`, trust CI.
- Never `git push --force`, never `--no-verify`.
- One commit per ship. If you want multiple commits, make them manually before calling `/ship-issue`.
- PR body AC checkboxes only ticked when provably implemented.
- German for user-facing output; English for commit message, PR title, PR body.
