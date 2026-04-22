---
name: pick-issue
description: Recommend the next GitHub issue to work on as a ranked shortlist (3–5 candidates) with reasoning. Use when the user wants to decide what to work on next from the open issues.
---

# Pick Issue

Output a ranked shortlist of 3–5 open issues the user should consider working on next. Purely advisory — does not mutate git or GitHub.

Relationships (parent/child, blocked-by, blocking) are read from GitHub's **native Issue Relationships** via GraphQL. Project v2 `Status` and issue `assignees` drive the resume-first behaviour. No body-text parsing for any of this.

## Arguments

All optional:

- `--label <name>` — pass through to the issues query
- `--milestone <name>` — pass through to the issues query
- `--exclude <N,M,…>` — comma-separated issue numbers to omit from the shortlist

## Process

### 1. Resolve repo + Project v2

```bash
gh repo view --json owner,name --jq '{owner:.owner.login,name:.name}'
```

Resolve the linked Project v2 with a `Status` single-select field (`Todo`/`In Progress`/`In Review`/`Done`) per the shared mechanic in `start-issue/SKILL.md`. If it can't be resolved, skip the resume-first step (step 6) — don't abort here, `pick-issue` is advisory.

### 2. Fetch all open issues with relationships + status + assignees

One GraphQL call, paginated if needed:

```bash
gh api graphql -f query='
query($owner:String!,$name:String!){
  repository(owner:$owner,name:$name){
    issues(states:OPEN, first:100){
      nodes{
        number title url createdAt
        labels(first:20){ nodes{ name } }
        milestone{ title }
        assignees(first:10){ nodes{ login } }
        parent { number }
        subIssues(first:50){ nodes{ number state } }
        blockedBy(first:50){ nodes{ number state } }
        blocking(first:50){ nodes{ number state } }
        projectItems(first:5){
          nodes{
            project{ id }
            fieldValueByName(name:"Status"){
              ... on ProjectV2ItemFieldSingleSelectValue{ name }
            }
          }
        }
      }
      pageInfo{ hasNextPage endCursor }
    }
  }
}' -f owner=<owner> -f name=<name>
```

For each issue, pull the status string from the `projectItems` node whose `project.id` matches the resolved Project v2 ID. Apply `--label` / `--milestone` filters client-side.

### 3. Exclude issues with an open PR

```bash
gh pr list --state open --json number,body,headRefName
```

Remove any issue numbers referenced by an open PR via:

- `Closes #N` / `Fixes #N` / `Resolves #N` in the PR body (case-insensitive)
- `issue-N` or `#N` pattern in the branch name

### 4. Apply `--exclude`

Remove any issue numbers listed in `--exclude`.

### 5. Build the blocker graph

Each issue's `blockedBy` field gives the direct blockers natively. Only count blockers whose `state == OPEN` as active.

Compute transitive blockers iteratively until stable. Mark all members of any detected cycle as blocked and record a warning.

`parent` is **not** a blocker — PRDs stay open while children are in progress.

### 6. Resume-first detection

```bash
ME=$(gh api user --jq .login)
gh pr list --state all --json number,state,mergedAt,body,headRefName --limit 200
```

Two buckets of rows, both bypass the normal ranking and go to the top of the output.

**6a. Resume candidates** — work you started and may have been interrupted on:

- Status (from step 2) equals `In Progress` (case-insensitive)
- `assignees` contains `ME`
- not excluded by step 4

Up to 3 resume rows, oldest `createdAt` first. `Warum jetzt: In Progress — weitermachen`.

**6b. Zombie candidates** — shipped, PR rejected, state contradicts itself:

- Status equals `In Review` (case-insensitive)
- `assignees` contains `ME`
- not excluded by step 4
- no **open** PR references this issue (step 3 set computed this)
- at least one **closed-unmerged** PR references this issue (from the all-state PR list above: `state == CLOSED` and `mergedAt == null`, matched by `Closes/Fixes/Resolves #N` in body or `issue-N` in `headRefName`)

Up to 2 zombie rows. `Warum jetzt: PR geschlossen — klären`. Kickoff `/start-issue <N>` will detect the zombie on re-entry and prompt for resolution — see `start-issue/SKILL.md` step 3.

Combined, resume + zombie rows cap at 5; if there's room left, the remaining slots come from ranked ready candidates (step 9).

### 7. Exclude PRDs with open sub-issues

An issue is treated as a PRD if its `subIssues` field contains at least one node. Exclude it from the candidate set if any of those sub-issues has `state == OPEN`.

### 8. Split remaining candidates

After removing resume candidates (step 6) from the pool:

- **Ready**: no active blockers, not a PRD-with-open-children, not PR'd, not excluded, not already surfaced as a resume row.
- **Blocked**: everything else remaining.

If both `resume` and `ready` are empty → go to step 11 (fallback).

### 9. Rank ready candidates

1. **Primary — unblock potential**: for each ready issue, read its native `blocking` field. Count only those with `state == OPEN`. Higher = better.
2. **Secondary — momentum**: if the issue has a `parent`, check whether that parent has at least one **closed** sub-issue. If yes → bonus.
3. **Tertiary — LLM judgment**: take the top 5 after (1)+(2). For each, fetch comments:

   ```bash
   gh issue view <N> --json comments
   ```

   Read each body + comments. Re-order within the top 5 based on:
   - Clarity of acceptance criteria
   - Slice size
   - Comment signals suggesting deprioritization (`later`, `on hold`, `skip`, `waiting on X`) → de-rank or flag
   - Comment hints at external soft-block → flag

Produce a ranked list such that **resume rows + ranked ready rows ≤ 5 total**.

### 10. Output the shortlist

A 4-column Markdown table. Zombie rows first (they demand immediate attention), then resume rows, then ranked ready rows:

```
| #  | Titel              | Warum jetzt                     | Kickoff          |
|----|--------------------|---------------------------------|------------------|
| 19 | <title>            | PR geschlossen — klären         | /start-issue 19  |
| 17 | <title>            | In Progress — weitermachen      | /start-issue 17  |
| 21 | <title>            | blockt #24, #27; PRD #10 aktiv  | /start-issue 21  |
```

Rules for the `Warum jetzt` column — one line, only what's true:

- `PR geschlossen — klären` — zombie row (step 6b)
- `In Progress — weitermachen` — resume row (step 6a)
- `blockt #A, #B` — ready row that unblocks others (from `blocking` field)
- `PRD #N aktiv` — parent PRD has at least one closed sub-issue
- `Kommentar: <short phrase>` — only if a comment signal actually moved the ranking

Below the table, a **context block for the top-1 candidate only** (which is a resume row if any exist, else the top-ranked ready):

- One-sentence AC summary
- `Parent: #N <title>` if any
- Any warnings (circular deps, parent branch gone, etc.)

Kickoff for every row is `/start-issue <N>` — the skill is idempotent, so for resume rows it simply switches back into the existing branch and re-briefs.

### 11. Fallback: no resume rows and no ready candidates

Show a **root-blocker shortlist** instead. A root-blocker is an issue that:

- has no active blockers itself (empty or fully-closed `blockedBy`), AND
- is referenced (directly or transitively) as a blocker by at least one other open issue

Rank root-blockers by how many open issues they would unblock (transitive count across `blocking`). Use the same 4-column table, with `Warum jetzt` replaced by `Schaltet frei`:

```
**Nichts direkt ready.** Alle offenen Issues hängen an einem dieser Root-Blocker:

| #  | Titel                  | Schaltet frei         | Kickoff          |
|----|------------------------|-----------------------|------------------|
| 3  | Storage migration stub | #7, #12, #14, #21     | /start-issue 3   |
```

If even the root-blocker list is empty (pure circular deadlock), output a diagnostic: list the detected cycles so the user can resolve them manually.

## Rules

- Never mutate issues, labels, comments, git, or PRs.
- Never output more than 5 candidates total (resume + ready combined).
- Keep `Warum jetzt` to one line per row.
- Omit a signal rather than padding if it's uncertain.
- If Project v2 isn't resolvable, skip the resume-first step silently and run steps 7–10 as before — this skill is advisory and should still produce useful output in a degraded environment.
