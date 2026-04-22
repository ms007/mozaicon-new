---
name: start-issue
description: Start work on a GitHub issue — creates a feature branch, assigns it to you, sets Project v2 status to "In Progress", and briefs you on the work. Use when the user wants to kick off work on a specific issue number.
---

# Start Issue

Kick off work on a GitHub issue: preflight → branch → assign + status → brief.

This skill is the only place that transitions an issue from `Todo` to `In Progress`. Re-entering on an already-started issue is idempotent: the branch is switched to, the user gets re-briefed, no duplicate state changes.

## Argument

Required: issue number (e.g. `/start-issue 17`).

## Process

### 1. Preflight (hard aborts on any failure)

Run these checks in parallel where possible:

```bash
gh auth status
git status --porcelain          # must be empty
git branch --show-current
gh issue view <N> --json state,assignees,title,labels,body
```

Rules:

- `git status --porcelain` not empty → abort: "commit or stash your changes first".
- Current branch is `main` → `git fetch origin main && git pull --ff-only`. If fast-forward fails, abort.
- Current branch is a feature branch → accept as base, no pull.
- Issue state not `OPEN` → abort.

Fetch blockers via GraphQL:

```bash
gh api graphql -f query='
query($owner:String!,$name:String!,$number:Int!){
  repository(owner:$owner,name:$name){
    issue(number:$number){
      blockedBy(first:50){ nodes{ number state } }
    }
  }
}' -f owner=<owner> -f name=<name> -F number=<N>
```

Any `state == OPEN` blocker → abort with the list.

### 2. Resolve Project v2 (hard abort if not found)

See **Shared: Project v2 resolution** at the bottom. You need:

- `PROJECT_ID`
- `STATUS_FIELD_ID`
- option IDs for `Todo`, `In Progress`, `In Review`, `Done`

If resolution fails, abort with: "No Project v2 with a Status field (Todo/In Progress/In Review/Done) linked to this repo — link one before using /start-issue."

### 3. Idempotency check + zombie detection

```bash
git branch --list '*/issue-<N>-*'
```

No matching branch → regular path: fall through to step 4.

Matching branch found → check PRs on this branch:

```bash
gh pr list --head <branch> --state all --json number,state,mergedAt,url
```

Three cases:

- **No PR, or only an open PR** → regular re-entry. `git switch <branch>`, skip to step 6 (re-brief). Do not re-assign, do not flip status (it's already `In Progress`).
- **Merged PR exists** → the issue should already be closed via `Closes #N`. If it's still open, Project automation is lagging. Warn the user, treat as regular re-entry.
- **Only closed-unmerged PR(s) — zombie**. The PR was rejected; state is contradictory. Resolve with a single interactive prompt.

#### Zombie resolution

Use `AskUserQuestion` to present three options. This is the only interactive prompt in the entire skill set — the decision is not rateable from context and the consequences differ sharply in destructiveness.

```
⚠ PR #<K> für Issue #<N> wurde geschlossen ohne Merge.

  (1) Weiterarbeiten        — selber Branch, Status → In Progress
  (2) Neu aufsetzen         — Branch löschen, frisch von base abzweigen
  (3) Feature absagen       — Branch löschen, Issue schliessen, Status → Done
```

Dispatch:

- **(1) Weiterarbeiten** — `git switch <branch>`. Continue to step 5 (status flip back to `In Progress`) and step 6 (brief). `/implement-issue` later will pick up the closed PR's comments alongside issue comments.
- **(2) Neu aufsetzen** — destructive:
  ```bash
  git switch $(git config branch.<branch>.base || echo main)
  git branch -D <branch>
  git push origin --delete <branch> 2>/dev/null || true
  git config --unset branch.<branch>.base 2>/dev/null || true
  ```
  Then fall through to step 4 (create a fresh branch). Step 5 and 6 run normally.
- **(3) Feature absagen** — destructive + exits early:
  ```bash
  git switch $(git config branch.<branch>.base || echo main)
  git branch -D <branch>
  git push origin --delete <branch> 2>/dev/null || true
  git config --unset branch.<branch>.base 2>/dev/null || true
  gh issue close <N> --reason not_planned
  ```
  Then GraphQL `updateProjectV2ItemFieldValue` → Status `Done`. **Exit the skill** — skip steps 4–6, no brief.

### 4. Create branch

Pick prefix from issue labels (case-insensitive, first match wins):

- `bug` or `fix` → `fix/`
- `chore` → `chore/`
- else → `feat/`

Slug: kebab-cased title, ASCII-only, truncated to ~50 chars.

```bash
PARENT=$(git branch --show-current)
git switch -c <prefix>/issue-<N>-<slug>
git config branch.<prefix>/issue-<N>-<slug>.base "$PARENT"
```

The recorded base is what `ship-issue` uses as PR target. If `PARENT` was `main`, the PR goes to `main`; if it was another feature branch, the PR stacks on top.

### 5. GitHub side effects

```bash
# Assign to self (skip if already assigned)
gh issue edit <N> --add-assignee @me

# Add issue to project if not present (idempotent; errors if already there are ignored)
gh api graphql -f query='
mutation($project:ID!,$content:ID!){
  addProjectV2ItemById(input:{projectId:$project,contentId:$content}){
    item{ id }
  }
}' -f project=<PROJECT_ID> -f content=<ISSUE_NODE_ID>

# Set Status = In Progress
gh api graphql -f query='
mutation($project:ID!,$item:ID!,$field:ID!,$option:String!){
  updateProjectV2ItemFieldValue(input:{
    projectId:$project,itemId:$item,fieldId:$field,
    value:{ singleSelectOptionId:$option }
  }){ projectV2Item{ id } }
}' -f project=<PROJECT_ID> -f item=<ITEM_ID> \
     -f field=<STATUS_FIELD_ID> -f option=<IN_PROGRESS_OPTION_ID>
```

### 6. Brief the user (always, even on re-entry)

Output in German. Structure:

```
## Issue #<N>: <title>

**Was zu bauen ist**
<## What to build extracted from body>

**Acceptance criteria**
- [ ] <AC 1>
- [ ] <AC 2>

**Kontext**
- Parent PRD: #<M> <title>   (if any)
- Labels: <list>
- Branch: <branch name> (base: <parent>)

**Einstieg**
<one sentence suggesting which file/area to look at first, based on a quick repo skim
 against AC keywords>
```

Next expected user action: `/implement-issue`.

## Shared: Project v2 resolution

Used by `start-issue`, `implement-issue`, `ship-issue`, and `pick-issue`.

```bash
OWNER=$(gh repo view --json owner --jq .owner.login)
NAME=$(gh repo view --json name --jq .name)

gh api graphql -f query='
query($owner:String!,$name:String!){
  repository(owner:$owner,name:$name){
    projectsV2(first:20){
      nodes{
        id title
        fields(first:30){
          nodes{
            ... on ProjectV2SingleSelectField{
              id name
              options{ id name }
            }
          }
        }
      }
    }
  }
}' -f owner="$OWNER" -f name="$NAME"
```

Pick the first project whose fields contain a `ProjectV2SingleSelectField` named `Status` (case-insensitive) with options covering `Todo`, `In Progress`, `In Review`, `Done` (case-insensitive match). Cache nothing — re-resolve each run.

To find the project item for a specific issue (needed for status updates):

```bash
gh api graphql -f query='
query($owner:String!,$name:String!,$number:Int!){
  repository(owner:$owner,name:$name){
    issue(number:$number){
      id
      projectItems(first:10){
        nodes{ id project{ id } }
      }
    }
  }
}' -f owner="$OWNER" -f name="$NAME" -F number=<N>
```

Match `project.id == PROJECT_ID`. If no match, add the issue to the project first (`addProjectV2ItemById`, see step 5), then re-query.

## Rules

- German for all user-facing output; English for all GitHub artefacts.
- Hard-abort on Project v2 resolution failure — no silent fallback.
- Never commit, never push, never open a PR — those belong to `ship-issue`.
- Never change status to anything other than `In Progress` here.
