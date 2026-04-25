import * as sandcastle from '@ai-hero/sandcastle'
import { mkdirSync } from 'node:fs'
import {
  docker,
  featureVolumes,
  issueVolumes,
  removeVolumes,
  workspaceVolumes,
} from './lib/sandbox.ts'
import {
  getRepoInfo,
  resolveProject,
  getPrd,
  getSubIssues,
  getReadyIssues,
  getInProgressIssues,
  findBlockingIssueNumbers,
  setIssueStatus,
  closeIssue,
  createPr,
  prExistsForBranch,
  extractSection,
  type Issue,
  type ProjectInfo,
} from './lib/github.ts'
import {
  requireCleanWorktree,
  ensureFeatureBranch,
  switchBranch,
  pushBranch,
  attemptMerge,
  abortMerge,
  runPnpmCheck,
  runPnpmInstall,
  slugify,
  branchHasCommitsAhead,
  branchExists,
  remoteBranchExists,
} from './lib/git.ts'

const MAX_ITERATIONS = 10
const MAX_PARALLEL = 3
const POLL_INTERVAL_MS = 30_000

const IMAGE_NAME = 'sandcastle:mozaicon'

/**
 * Sandbox factory for an issue's implement/review run. Mounts persistent
 * named volumes for `node_modules/` and `.pnpm-store/` so the heavy
 * directories stay off the bind-mount FS — that keeps `chown` inside the
 * 120 s container-start budget and lets `pnpm install --prefer-offline`
 * reuse the cache between iterations.
 */
const sandboxForIssue = (repoName: string, issueNumber: number) =>
  docker({
    imageName: IMAGE_NAME,
    volumes: workspaceVolumes(issueVolumes(repoName, issueNumber)),
  })

/**
 * Sandbox factory for the merge-agent run. Volumes are scoped to the PRD's
 * feature branch so successive merge attempts share the same install cache.
 */
const sandboxForMerge = (repoName: string, prdNumber: number) =>
  docker({
    imageName: IMAGE_NAME,
    volumes: workspaceVolumes(featureVolumes(repoName, prdNumber)),
  })

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

interface Ctx {
  prd: Issue
  featureBranch: string
  project: ProjectInfo
  owner: string
  name: string
}

async function main(): Promise<void> {
  const arg = process.argv[2]
  if (!arg || Number.isNaN(Number(arg))) {
    console.error('Usage: pnpm sandcastle <PRD-NUMBER>')
    process.exit(1)
  }
  const prdNumber = Number(arg)

  console.log(`\n🏰 Sandcastle Orchestrator — PRD #${prdNumber}\n`)

  requireCleanWorktree()

  const { owner, name } = getRepoInfo()
  console.log(`Repo: ${owner}/${name}`)

  const project = resolveProject(owner, name)
  console.log(`Project v2: ${project.projectId}`)

  const prd = getPrd(owner, name, prdNumber)
  if (prd.state !== 'OPEN') {
    console.error(`PRD #${prdNumber} is ${prd.state}. Only OPEN PRDs are supported.`)
    process.exit(1)
  }

  const featureBranch = ensureFeatureBranch(prdNumber, prd.title)
  console.log(`Feature branch: ${featureBranch}`)

  setIssueStatus(project, prd.id, project.inProgressOptionId)
  console.log(`PRD status → In Progress`)

  mkdirSync('.sandcastle/logs', { recursive: true })

  // Recovery: reset any stale "In Progress" sandcastle sub-issues from a crashed run.
  // The orchestrator is single-process, so any In Progress status at startup is stale.
  // "In Review" is intentionally NOT reset: branch is already pushed, only merge
  // remains. The iteration loop picks them up via the resume-merge path below.
  const startupSubs = getSubIssues(owner, name, prdNumber, project.projectId)
  const stale = getInProgressIssues(startupSubs)
  if (stale.length > 0) {
    console.log(`♻️  Resetting ${stale.length} stale "In Progress" sub-issue(s) to Todo:`)
    for (const i of stale) {
      console.log(`   #${i.number}: ${i.title}`)
      setIssueStatus(project, i.id, project.todoOptionId)
    }
  }

  const ctx: Ctx = { prd, featureBranch, project, owner, name }

  // Issues we've already routed through mergeAll in this orchestrator run.
  // Prevents infinite loops when a merge fails and the issue stays In Review.
  const mergeAttempted = new Set<number>()

  for (let iter = 1; iter <= MAX_ITERATIONS; iter++) {
    console.log(`\n=== Iteration ${iter}/${MAX_ITERATIONS} ===\n`)

    const subs = getSubIssues(owner, name, prdNumber, project.projectId)
    const openSandcastle = subs.filter((i) => i.state === 'OPEN' && i.labels.includes('sandcastle'))

    if (openSandcastle.length === 0) {
      console.log('✅ All sandcastle sub-issues closed.')
      break
    }

    // Resume "In Review" issues from a prior orchestrator run.
    // Heuristic — pushBranch() runs only after review completes:
    //   remote branch exists  → review done       → straight to merge
    //   only local branch     → review incomplete → re-run review, then merge
    //   no branch at all      → anomaly           → reset to Todo
    const inReview = openSandcastle.filter((i) => i.status === 'In Review')
    const resumeMerges: Array<{ issue: Issue; branch: string }> = []
    for (const issue of inReview) {
      if (mergeAttempted.has(issue.number)) continue
      const branch = `sandcastle/issue-${issue.number}-${slugify(issue.title)}`

      if (!branchExists(branch)) {
        console.warn(
          `#${issue.number} is In Review but no local branch '${branch}' exists; resetting to Todo.`,
        )
        setIssueStatus(ctx.project, issue.id, ctx.project.todoOptionId)
        continue
      }

      if (remoteBranchExists(branch)) {
        console.log(`[#${issue.number}] resume → review already pushed, going straight to merge.`)
        resumeMerges.push({ issue, branch })
      } else {
        console.log(
          `[#${issue.number}] resume → review incomplete (no remote branch), re-running review.`,
        )
        try {
          const entry = await runReviewOnly(issue, branch, ctx)
          resumeMerges.push(entry)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          console.error(`[#${issue.number}] resume review failed: ${msg}`)
          console.error(
            `       → marking attempted for this run; will not retry until next invocation`,
          )
          mergeAttempted.add(issue.number)
        }
      }
    }
    if (resumeMerges.length > 0) {
      console.log(`🔁 Merging ${resumeMerges.length} resumed sub-issue(s):`)
      for (const { issue } of resumeMerges) console.log(`   #${issue.number}: ${issue.title}`)
      for (const { issue } of resumeMerges) mergeAttempted.add(issue.number)
      await mergeAll(resumeMerges, ctx)
      continue
    }

    const ready = getReadyIssues(subs)

    if (ready.length === 0) {
      const inProgress = getInProgressIssues(subs)
      if (inProgress.length > 0) {
        console.log(
          `⏳ ${inProgress.length} sub-issue(s) In Progress, none ready. Waiting ${POLL_INTERVAL_MS / 1000}s...`,
        )
        await sleep(POLL_INTERVAL_MS)
        continue
      }

      const blockers = findBlockingIssueNumbers(subs)
      if (blockers.length > 0) {
        console.log('⏸️  Waiting on blocking issues (HITL or non-sandcastle):')
        for (const n of blockers) console.log(`   #${n}`)
        console.log('\nRe-run `pnpm sandcastle ' + prdNumber + '` after blockers close.')
        process.exit(0)
      }

      console.error(
        '❌ Deadlock: open sandcastle sub-issues with no ready candidate and no detectable blocker.',
      )
      for (const i of openSandcastle) {
        console.error(`   #${i.number} [${i.status}] ${i.title}`)
      }
      process.exit(1)
    }

    const batch = ready.slice(0, MAX_PARALLEL)
    console.log(`🚀 Running ${batch.length} sub-issue(s) in parallel:`)
    for (const i of batch) console.log(`   #${i.number}: ${i.title}`)

    const settled = await Promise.allSettled(batch.map((i) => runIssue(i, ctx)))

    const successful: Array<{ issue: Issue; branch: string }> = []
    for (const [idx, r] of settled.entries()) {
      const issue = batch[idx]!
      if (r.status === 'fulfilled' && r.value) {
        successful.push(r.value)
      } else if (r.status === 'rejected') {
        console.error(`   ✗ #${issue.number} run failed: ${r.reason}`)
        console.error(`       → resetting status to Todo so it's retried next iteration`)
        setIssueStatus(ctx.project, issue.id, ctx.project.todoOptionId)
      } else {
        console.warn(`   - #${issue.number} produced no commits, skipping merge.`)
        console.warn(`       → resetting status to Todo`)
        setIssueStatus(ctx.project, issue.id, ctx.project.todoOptionId)
      }
    }

    if (successful.length === 0) {
      console.log('No successful sub-issue runs this iteration.')
      continue
    }

    for (const { issue } of successful) mergeAttempted.add(issue.number)
    await mergeAll(successful, ctx)
  }

  // Final PR only when every sandcastle sub-issue is closed (loop exited via break).
  // Hitting MAX_ITERATIONS or any other fall-through means partial work — skip.
  const finalSubs = getSubIssues(owner, name, prdNumber, project.projectId)
  const stillOpen = finalSubs.filter((i) => i.state === 'OPEN' && i.labels.includes('sandcastle'))
  if (stillOpen.length > 0) {
    console.log(
      `\n⚠️  ${stillOpen.length} sub-issue(s) still open after ${MAX_ITERATIONS} iterations — skipping final PR:`,
    )
    for (const i of stillOpen) console.log(`   #${i.number} [${i.status}] ${i.title}`)
    process.exit(1)
  }

  await createFinalPrIfReady(ctx)
}

async function runIssue(issue: Issue, ctx: Ctx): Promise<{ issue: Issue; branch: string } | null> {
  const branch = `sandcastle/issue-${issue.number}-${slugify(issue.title)}`
  console.log(`\n[#${issue.number}] START → ${branch}`)

  setIssueStatus(ctx.project, issue.id, ctx.project.inProgressOptionId)

  await using sandbox = await sandcastle.createSandbox({
    branch,
    sandbox: sandboxForIssue(ctx.name, issue.number),
    throwOnDuplicateWorktree: false,
    hooks: {
      sandbox: {
        onSandboxReady: [{ command: 'pnpm install --prefer-offline' }],
      },
    },
  })

  console.log(`[#${issue.number}] IMPLEMENT`)
  const implResult = await sandbox.run({
    name: `implement-${issue.number}`,
    agent: sandcastle.claudeCode('claude-opus-4-6'),
    promptFile: './.sandcastle/prompts/implement.md',
    promptArgs: {
      ISSUE_NUMBER: String(issue.number),
      ISSUE_TITLE: issue.title,
      BRANCH: branch,
      FEATURE_BRANCH: ctx.featureBranch,
      PRD_NUMBER: String(ctx.prd.number),
    },
    completionSignal: '<promise>COMPLETE</promise>',
    maxIterations: 5,
    logging: { type: 'file', path: `.sandcastle/logs/implement-${issue.number}.log` },
  })

  if (implResult.commits.length === 0) {
    console.warn(`[#${issue.number}] implementer produced no commits, skipping review/merge.`)
    return null
  }

  console.log(`[#${issue.number}] REVIEW`)
  setIssueStatus(ctx.project, issue.id, ctx.project.inReviewOptionId)
  await sandbox.run({
    name: `review-${issue.number}`,
    agent: sandcastle.claudeCode('claude-sonnet-4-6'),
    promptFile: './.sandcastle/prompts/review.md',
    promptArgs: {
      ISSUE_NUMBER: String(issue.number),
      ISSUE_TITLE: issue.title,
      BRANCH: branch,
      FEATURE_BRANCH: ctx.featureBranch,
    },
    completionSignal: '<promise>COMPLETE</promise>',
    maxIterations: 3,
    logging: { type: 'file', path: `.sandcastle/logs/review-${issue.number}.log` },
  })

  pushBranch(branch)

  return { issue, branch }
}

/**
 * Resume path: implement is already done (commits exist on `branch`) but
 * review didn't push. Re-runs only the review agent, then pushes.
 */
async function runReviewOnly(
  issue: Issue,
  branch: string,
  ctx: Ctx,
): Promise<{ issue: Issue; branch: string }> {
  console.log(`[#${issue.number}] RESUME REVIEW → ${branch}`)

  await using sandbox = await sandcastle.createSandbox({
    branch,
    sandbox: sandboxForIssue(ctx.name, issue.number),
    throwOnDuplicateWorktree: false,
    hooks: {
      sandbox: {
        onSandboxReady: [{ command: 'pnpm install --prefer-offline' }],
      },
    },
  })

  await sandbox.run({
    name: `review-${issue.number}`,
    agent: sandcastle.claudeCode('claude-sonnet-4-6'),
    promptFile: './.sandcastle/prompts/review.md',
    promptArgs: {
      ISSUE_NUMBER: String(issue.number),
      ISSUE_TITLE: issue.title,
      BRANCH: branch,
      FEATURE_BRANCH: ctx.featureBranch,
    },
    completionSignal: '<promise>COMPLETE</promise>',
    maxIterations: 3,
    logging: { type: 'file', path: `.sandcastle/logs/review-${issue.number}.log` },
  })

  pushBranch(branch)
  return { issue, branch }
}

async function mergeAll(entries: Array<{ issue: Issue; branch: string }>, ctx: Ctx): Promise<void> {
  switchBranch(ctx.featureBranch)

  for (const { issue, branch } of entries) {
    if (!branchHasCommitsAhead(branch, ctx.featureBranch)) {
      console.log(`[#${issue.number}] no commits ahead of feature branch, skipping.`)
      continue
    }

    console.log(`[#${issue.number}] MERGE → ${ctx.featureBranch}`)
    const mergeMsg = `Merge ${branch} into ${ctx.featureBranch}\n\nCloses #${issue.number}`
    const attempt = attemptMerge(branch, mergeMsg)

    if (attempt.ok) {
      const install = runPnpmInstall()
      if (!install.ok) {
        console.error(
          `[#${issue.number}] merged OK but pnpm install failed. Leaving merge commit for manual review.`,
        )
        console.error(install.output.slice(-2000))
        continue
      }
      const check = runPnpmCheck()
      if (!check.ok) {
        console.error(
          `[#${issue.number}] merged OK but pnpm check failed. Leaving merge commit for manual review.`,
        )
        console.error(check.output.slice(-2000))
        continue
      }
    } else if (attempt.conflict) {
      console.log(`[#${issue.number}] conflict detected — invoking merge-agent...`)
      abortMerge()

      switchBranch('main')
      try {
        await using mergerSbx = await sandcastle.createSandbox({
          branch: ctx.featureBranch,
          sandbox: sandboxForMerge(ctx.name, ctx.prd.number),
          throwOnDuplicateWorktree: false,
          hooks: {
            sandbox: {
              onSandboxReady: [{ command: 'pnpm install --prefer-offline' }],
            },
          },
        })

        const mergeResult = await mergerSbx.run({
          name: `merge-${issue.number}`,
          agent: sandcastle.claudeCode('claude-sonnet-4-6'),
          promptFile: './.sandcastle/prompts/merge.md',
          promptArgs: {
            ISSUE_NUMBER: String(issue.number),
            BRANCH: branch,
            FEATURE_BRANCH: ctx.featureBranch,
          },
          completionSignal: ['<promise>COMPLETE</promise>', '<promise>MERGE_FAILED</promise>'],
          maxIterations: 5,
          logging: { type: 'file', path: `.sandcastle/logs/merge-${issue.number}.log` },
        })

        if (mergeResult.completionSignal !== '<promise>COMPLETE</promise>') {
          console.error(
            `[#${issue.number}] merge-agent did not complete (signal: ${mergeResult.completionSignal ?? 'none'}). Skipping close.`,
          )
          continue
        }
      } finally {
        switchBranch(ctx.featureBranch)
      }

      const postInstall = runPnpmInstall()
      if (!postInstall.ok) {
        console.error(`[#${issue.number}] post-merge pnpm install failed.`)
        console.error(postInstall.output.slice(-2000))
        continue
      }
      const postCheck = runPnpmCheck()
      if (!postCheck.ok) {
        console.error(`[#${issue.number}] post-merge pnpm check failed.`)
        console.error(postCheck.output.slice(-2000))
        continue
      }
    } else {
      console.error(`[#${issue.number}] merge failed without conflict markers. Aborting.`)
      abortMerge()
      continue
    }

    closeIssue(issue.number, 'Implemented and merged via Sandcastle.')
    setIssueStatus(ctx.project, issue.id, ctx.project.doneOptionId)

    // Issue is fully done — drop its persistent caches so we don't leak
    // named docker volumes per closed issue.
    const v = issueVolumes(ctx.name, issue.number)
    await removeVolumes([v.nodeModules, v.pnpmStore])

    console.log(`[#${issue.number}] ✅ DONE`)
  }

  pushBranch(ctx.featureBranch)
}

async function createFinalPrIfReady(ctx: Ctx): Promise<void> {
  switchBranch(ctx.featureBranch)
  pushBranch(ctx.featureBranch)

  const existing = prExistsForBranch(ctx.featureBranch)
  if (existing) {
    console.log(`\n✅ PR already open for ${ctx.featureBranch}: ${existing}`)
    return
  }

  const subs = getSubIssues(ctx.owner, ctx.name, ctx.prd.number, ctx.project.projectId)
  const closed = subs.filter((i) => i.state === 'CLOSED')

  const whatToBuild = extractSection(ctx.prd.body, 'What to build') || ctx.prd.title
  const body = buildPrBody(ctx.prd, whatToBuild, closed)
  const title = `feat: ${cleanTitle(ctx.prd.title)}`

  const url = createPr('main', ctx.featureBranch, title, body)
  console.log(`\n✅ Final PR opened: ${url}`)

  // PRD is shipped — drop the merge-agent's feature-scoped caches.
  const v = featureVolumes(ctx.name, ctx.prd.number)
  await removeVolumes([v.nodeModules, v.pnpmStore])
}

function buildPrBody(prd: Issue, whatToBuild: string, closedSubs: Issue[]): string {
  const subsBlock =
    closedSubs.map((s) => `- #${s.number} ${s.title}`).join('\n') || '- (no sub-issues)'

  return `## Summary

${whatToBuild}

## Included sub-issues

${subsBlock}

## Test plan

- Each sub-issue passed \`pnpm check\` (green lint + typecheck + tests) inside its sandbox before merge.
- Host also re-ran \`pnpm check\` after every merge into the feature branch.
- CI runs on this PR for the final check.

Closes #${prd.number}
`
}

function cleanTitle(title: string): string {
  const stripped = title.replace(/^(feat|fix|chore|refactor|test|docs)[:\s]+/i, '').trim()
  return stripped.charAt(0).toLowerCase() + stripped.slice(1)
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err instanceof Error ? err.message : err)
  if (err instanceof Error && err.stack) console.error(err.stack)
  process.exit(1)
})
