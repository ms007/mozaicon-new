import { execFileSync, spawnSync } from 'node:child_process'

function git(args: string[], opts: { stdio?: 'inherit' | 'pipe' } = {}): string {
  return execFileSync('git', args, {
    encoding: 'utf-8',
    stdio: opts.stdio === 'inherit' ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    maxBuffer: 50_000_000,
  }) as unknown as string
}

function gitNoThrow(args: string[]): { ok: boolean; stdout: string; stderr: string; code: number } {
  const r = spawnSync('git', args, { encoding: 'utf-8', maxBuffer: 50_000_000 })
  return {
    ok: r.status === 0,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
    code: r.status ?? -1,
  }
}

export function requireCleanWorktree(): void {
  const out = git(['status', '--porcelain'])
  if (out.trim() !== '') {
    throw new Error('Working tree is not clean. Commit or stash your changes first:\n' + out)
  }
}

export function currentBranch(): string {
  return git(['branch', '--show-current']).trim()
}

export function branchExists(branch: string): boolean {
  const r = spawnSync('git', ['rev-parse', '--verify', `refs/heads/${branch}`])
  return r.status === 0
}

export function remoteBranchExists(branch: string): boolean {
  const r = spawnSync('git', ['rev-parse', '--verify', `refs/remotes/origin/${branch}`])
  return r.status === 0
}

/**
 * Convert a title into an ASCII kebab-case slug, max 50 chars.
 * Mirrors the rule from start-issue SKILL.md.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '')
}

/**
 * Idempotent feature-branch resolution:
 * - If any branch matching `feat/prd-<N>-*` exists locally, switch to it and pull.
 * - Else create `feat/prd-<N>-<slug>` from a freshly pulled main and push.
 * Returns the final branch name.
 */
export function ensureFeatureBranch(prdNumber: number, title: string): string {
  const existing = git(['branch', '--list', `feat/prd-${prdNumber}-*`])
    .split('\n')
    .map((l) => l.replace(/^[\s*]+/, '').trim())
    .filter(Boolean)

  if (existing.length > 0) {
    const branch = existing[0]!
    git(['switch', branch], { stdio: 'inherit' })
    if (remoteBranchExists(branch)) {
      const r = gitNoThrow(['pull', '--ff-only', 'origin', branch])
      if (!r.ok) {
        throw new Error(
          `git pull --ff-only origin ${branch} failed. Resolve divergence manually.\n` + r.stderr,
        )
      }
    }
    return branch
  }

  git(['fetch', 'origin', 'main'], { stdio: 'inherit' })
  git(['switch', 'main'], { stdio: 'inherit' })
  git(['pull', '--ff-only', 'origin', 'main'], { stdio: 'inherit' })

  const branch = `feat/prd-${prdNumber}-${slugify(title)}`
  git(['switch', '-c', branch], { stdio: 'inherit' })
  git(['push', '-u', 'origin', branch], { stdio: 'inherit' })
  return branch
}

export function switchBranch(branch: string): void {
  git(['switch', branch], { stdio: 'inherit' })
}

export function pushBranch(branch: string): void {
  git(['push', '-u', 'origin', branch], { stdio: 'inherit' })
}

/**
 * Attempt to merge `branch` into the current branch with --no-ff.
 * Returns whether the merge succeeded. On conflict, the working tree is left
 * in the conflicted state for the caller to escalate to the merge-agent.
 */
export function attemptMerge(branch: string, message: string): { ok: boolean; conflict: boolean } {
  const r = gitNoThrow(['merge', '--no-ff', '-m', message, branch])
  if (r.ok) return { ok: true, conflict: false }
  const conflict = /conflict/i.test(r.stdout) || /conflict/i.test(r.stderr)
  return { ok: false, conflict }
}

export function abortMerge(): void {
  gitNoThrow(['merge', '--abort'])
}

export function runPnpmCheck(): { ok: boolean; output: string } {
  const r = spawnSync('pnpm', ['check'], { encoding: 'utf-8', maxBuffer: 50_000_000 })
  return { ok: r.status === 0, output: (r.stdout ?? '') + (r.stderr ?? '') }
}

/** List branches that contain commits not reachable from the target branch. */
export function branchHasCommitsAhead(branch: string, target: string): boolean {
  const r = spawnSync('git', ['rev-list', '--count', `${target}..${branch}`], {
    encoding: 'utf-8',
  })
  if (r.status !== 0) return false
  const n = Number.parseInt((r.stdout ?? '0').trim(), 10)
  return n > 0
}
