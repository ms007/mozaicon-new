# TASK

The host-side merge of **{{BRANCH}}** into **{{FEATURE_BRANCH}}** hit a
conflict. Resolve it, run the feedback loop, land the merge commit.

The working tree is mid-merge; conflicted files are marked with
`<<<<<<<`/`=======`/`>>>>>>>`. **{{FEATURE_BRANCH}}** is checked out.

# CONTEXT

<issue>

!`gh issue view {{ISSUE_NUMBER}} --json number,title,body`

</issue>

<conflict-status>

!`git status --short`

</conflict-status>

<conflicted-files>

!`git diff --name-only --diff-filter=U`

</conflicted-files>

# PROCESS

1. **Read both sides.** For every conflicted file:
   - Understand what `HEAD` (= {{FEATURE_BRANCH}}) intends.
   - Understand what the incoming branch (= {{BRANCH}}) intends.
   - Resolve in a way that preserves **both** intents. If truly incompatible,
     prefer the incoming branch (that's the new slice's work) and note it in
     the commit body.
2. **Remove every conflict marker.** No `<<<<<<<`, `=======`, `>>>>>>>`
   survives.
3. **Stage:** `git add <file> …`
4. **Verify:** `pnpm check` must be green. Red → fix and re-run once. Still
   red after 2 attempts → abort and escalate.
5. **Commit:**

   ```bash
   git commit -m "Merge {{BRANCH}} into {{FEATURE_BRANCH}}

   Resolves conflict on #{{ISSUE_NUMBER}}.

   Refs #{{ISSUE_NUMBER}}"
   ```

# RULES

- **No `gh` calls.** No comments, no status updates, no issue closing. The
  host handles all GitHub mutations.
- **No push.** The host pushes.
- **No silent abandonment.** If you can't land a clean merge, abort and
  emit `MERGE_FAILED` (below).

# ESCALATION

```bash
git merge --abort
```

Then:

```
<promise>MERGE_FAILED: <one-line reason></promise>
```

# DONE

Output `<promise>COMPLETE</promise>` when:

- `git status` is clean (no conflicts, no unstaged changes),
- the merge commit exists on `{{FEATURE_BRANCH}}`,
- `pnpm check` is green.
