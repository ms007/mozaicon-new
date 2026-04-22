---
name: create-issues
description: Break a plan, spec, or PRD into independently-grabbable GitHub issues using tracer-bullet vertical slices. Use when user wants to convert a plan into issues, create implementation tickets, or break down work into issues.
---

# Create Issues

Break a plan into independently-grabbable GitHub issues using vertical slices (tracer bullets).

Relationships between issues (parent/child, blocked-by) are set via GitHub's **native Issue Relationships** API — never via body text. This keeps the relationships queryable, visible in the GitHub UI, and free of drift.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a GitHub issue number or URL as an argument, fetch it with `gh issue view <number>` (with comments).

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code.

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if the source material has them)

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked as HITL and AFK?

Iterate until the user approves the breakdown.

### 5. Create the GitHub issues

For each approved slice in **dependency order** (blockers first, so blocker node IDs are known when creating dependents):

#### 5a. Create the issue

```bash
gh issue create --title "<slice title>" --body "<body from template below>"
```

Capture the returned issue URL and extract the number.

#### 5b. Fetch the node ID

```bash
gh issue view <number> --json id --jq .id
```

Node IDs (not issue numbers) are required by the GraphQL relationship mutations.

#### 5c. Link to parent PRD (if the source is a GitHub issue)

If the source material is a PRD issue, link this slice as a sub-issue of that PRD:

```bash
gh api graphql \
  -f query='mutation($p:ID!,$c:ID!){ addSubIssue(input:{issueId:$p,subIssueId:$c}){ issue{ number } } }' \
  -f p="<PRD_NODE_ID>" -f c="<SLICE_NODE_ID>"
```

The PRD's node ID should be fetched once at the start of the run and cached for all subsequent slices.

#### 5d. Mark blockers (if any)

For each blocker slice the user identified in step 4:

```bash
gh api graphql \
  -f query='mutation($i:ID!,$b:ID!){ addBlockedBy(input:{issueId:$i,blockingIssueId:$b}){ issue{ number } } }' \
  -f i="<THIS_SLICE_NODE_ID>" -f b="<BLOCKER_NODE_ID>"
```

Repeat for each blocker.

<issue-template>
## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
</issue-template>

Do NOT include `## Parent` or `## Blocked by` sections in the body — those relationships live in native GitHub fields now.

Do NOT close or modify any parent issue.
