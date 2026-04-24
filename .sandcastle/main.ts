import * as sandcastle from '@ai-hero/sandcastle'
import { docker } from '@ai-hero/sandcastle/sandboxes/docker'
import { podman } from '@ai-hero/sandcastle/sandboxes/podman'
import { mkdirSync } from 'node:fs'
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
  slugify,
  branchHasCommitsAhead,
} from './lib/git.ts'

const MAX_ITERATIONS = 10
const MAX_PARALLEL = 4
const POLL_INTERVAL_MS = 30_000

const IMAGE_NAME = 'sandcastle:mozaicon'

const sandboxProvider = () => {
  const engine = process.env.SANDCASTLE_ENGINE ?? 'podman'
  const opts = { imageName: IMAGE_NAME } as const
  return engine === 'docker' ? docker(opts) : podman(opts)
}

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
    console.error('Usage: pnpm sandcastle:run <PRD-NUMBER>')
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

  const ctx: Ctx = { prd, featureBranch, project, owner, name }

  for (let iter = 1; iter <= MAX_ITERATIONS; iter++) {
    console.log(`\n=== Iteration ${iter}/${MAX_ITERATIONS} ===\n`)

    const subs = getSubIssues(owner, name, prdNumber, project.projectId)
    const openSandcastle = subs.filter((i) => i.state === 'OPEN' && i.labels.includes('sandcastle'))

    if (openSandcastle.length === 0) {
      console.log('✅ All sandcastle sub-issues closed.')
      break
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
        console.log('\nRe-run `pnpm sandcastle:run ' + prdNumber + '` after blockers close.')
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
      } else {
        console.warn(`   - #${issue.number} produced no commits, skipping merge.`)
      }
    }

    if (successful.length === 0) {
      console.log('No successful sub-issue runs this iteration.')
      continue
    }

    await mergeAll(successful, ctx)
  }

  await createFinalPrIfReady(ctx)
}

async function runIssue(issue: Issue, ctx: Ctx): Promise<{ issue: Issue; branch: string } | null> {
  const branch = `sandcastle/issue-${issue.number}-${slugify(issue.title)}`
  console.log(`\n[#${issue.number}] START → ${branch}`)

  setIssueStatus(ctx.project, issue.id, ctx.project.inProgressOptionId)

  await using sandbox = await sandcastle.createSandbox({
    branch,
    sandbox: sandboxProvider(),
    throwOnDuplicateWorktree: false,
    copyToWorktree: ['node_modules'],
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
          sandbox: sandboxProvider(),
          throwOnDuplicateWorktree: false,
          copyToWorktree: ['node_modules'],
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
          completionSignal: ['<promise>COMPLETE</promise>', '<promise>MERGE_FAILED'],
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
