/**
 * Custom Docker sandbox provider for Sandcastle.
 *
 * Why we don't use `@ai-hero/sandcastle/sandboxes/docker` directly: the upstream
 * provider's container-start path runs `chown -R agent:agent /home/agent`,
 * which on macOS recurses through the bind-mounted worktree over VirtioFS /
 * gRPC-FUSE. Once the worktree contains a populated `node_modules/` (~400 MB,
 * 100k+ files), the chown alone exceeds the 120 s `CONTAINER_START_TIMEOUT_MS`
 * and `createSandbox` rejects with `ContainerStartTimeoutError`.
 *
 * Fix: keep the heavy directories off the host filesystem entirely. We mount
 * `node_modules/` and `.pnpm-store/` as **named Docker volumes**, which live on
 * the Linux-native overlay/ext4 inside Docker Desktop's VM. Recursive ops
 * there are one to two orders of magnitude faster than VirtioFS, and the
 * volumes persist across container restarts so `pnpm install --prefer-offline`
 * stays warm between iterations.
 *
 * The chown is also tightened: it skips `/home/agent/workspace` (the
 * bind-mount inherits host ownership already) and recurses into volume mount
 * points only when their root is still root-owned (i.e. first mount of a
 * fresh volume).
 */
import { execFile, execFileSync, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createInterface } from 'node:readline'
import { promisify } from 'node:util'
import {
  createBindMountSandboxProvider,
  type BindMountCreateOptions,
  type BindMountSandboxHandle,
  type BindMountSandboxProvider,
} from '@ai-hero/sandcastle'

const execFileAsync = promisify(execFile)

export interface VolumeMount {
  /** Named docker volume — created if missing, persists across container restarts. */
  readonly volumeName: string
  /** Path inside the sandbox where the volume is mounted. */
  readonly sandboxPath: string
}

export interface DockerOptions {
  readonly imageName: string
  /**
   * Persistent named docker volumes overlaid on workspace paths. Use for any
   * directory that would otherwise grow large inside the bind-mounted worktree
   * (`node_modules/`, package-manager stores). Caller owns the lifecycle:
   * volumes survive container removal and must be cleaned up explicitly via
   * {@link removeVolumes}.
   */
  readonly volumes?: readonly VolumeMount[]
}

/** Build a Sandcastle bind-mount provider backed by Docker. */
export const docker = (options: DockerOptions): BindMountSandboxProvider =>
  createBindMountSandboxProvider({
    name: 'docker',
    create: async ({ mounts, env }: BindMountCreateOptions): Promise<BindMountSandboxHandle> => {
      const containerName = `sandcastle-${randomUUID()}`
      const worktreePath =
        mounts.find((m) => m.sandboxPath === '/home/agent/workspace')?.sandboxPath ??
        '/home/agent/workspace'

      const hostUid = process.getuid?.() ?? 1000
      const hostGid = process.getgid?.() ?? 1000

      // `docker volume create` is idempotent — no-op if the volume already exists.
      for (const v of options.volumes ?? []) {
        await execFileAsync('docker', ['volume', 'create', v.volumeName])
      }

      const bindFlags = mounts.flatMap((m) => [
        '-v',
        m.readonly ? `${m.hostPath}:${m.sandboxPath}:ro` : `${m.hostPath}:${m.sandboxPath}`,
      ])
      const volumeFlags = (options.volumes ?? []).flatMap((v) => [
        '-v',
        `${v.volumeName}:${v.sandboxPath}`,
      ])
      const envFlags = Object.entries({ ...env, HOME: '/home/agent' }).flatMap(([k, v]) => [
        '-e',
        `${k}=${v}`,
      ])

      await execFileAsync('docker', [
        'run',
        '-d',
        '--name',
        containerName,
        ...envFlags,
        ...bindFlags,
        ...volumeFlags,
        '-w',
        worktreePath,
        '--user',
        `${hostUid}:${hostGid}`,
        options.imageName,
      ])

      // Make the home dir and freshly-mounted volumes writable for the runtime user.
      //
      // Scope is intentionally narrower than upstream's `chown -R /home/agent`:
      //   - `/home/agent/workspace` is a bind-mount; host already owns it, no chown needed.
      //   - Top-level `~/.local`, `~/.cache`, etc. — small, on overlay fs — get a deep chown.
      //   - Volume mount points get a deep chown only when still root-owned (first
      //     mount of a fresh volume); on warm reuse, depth-0 chown is enough since
      //     pnpm-created files are already owned by the runtime user.
      const volumePaths = (options.volumes ?? []).map((v) => v.sandboxPath)
      const volumeChownScript = volumePaths
        .map(
          (p) =>
            `chown ${hostUid}:${hostGid} ${p}; ` +
            `if [ "$(stat -c %u ${p}/.)" != "${hostUid}" ] || ` +
            `[ -n "$(find ${p} -maxdepth 2 ! -uid ${hostUid} -print -quit 2>/dev/null)" ]; ` +
            `then chown -R ${hostUid}:${hostGid} ${p}; fi`,
        )
        .join('; ')
      const chownScript = [
        // Each non-workspace top-level home entry, recursive (overlay fs, fast).
        `find /home/agent -mindepth 1 -maxdepth 1 ! -name workspace -exec chown -R ${hostUid}:${hostGid} {} +`,
        // /home/agent itself (depth 0) so the runtime user can create new dotfiles.
        `chown ${hostUid}:${hostGid} /home/agent`,
        ...(volumePaths.length > 0 ? [volumeChownScript] : []),
      ].join(' && ')

      await execFileAsync('docker', ['exec', '-u', 'root', containerName, 'sh', '-c', chownScript])

      const onExit = (): void => {
        try {
          execFileSync('docker', ['rm', '-f', containerName], { stdio: 'ignore' })
        } catch {
          /* best-effort */
        }
      }
      const onSignal = (): void => {
        onExit()
        process.exit(1)
      }
      process.on('exit', onExit)
      process.on('SIGINT', onSignal)
      process.on('SIGTERM', onSignal)

      const handle: BindMountSandboxHandle = {
        worktreePath,
        exec: (command, opts) => {
          const effective = opts?.sudo ? `sudo ${command}` : command
          const args = ['exec']
          if (opts?.cwd) args.push('-w', opts.cwd)
          args.push(containerName, 'sh', '-c', effective)

          if (opts?.onLine) {
            const onLine = opts.onLine
            return new Promise((resolve, reject) => {
              const proc = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] })
              const stdoutChunks: string[] = []
              const stderrChunks: string[] = []
              const rl = createInterface({ input: proc.stdout })
              rl.on('line', (line) => {
                stdoutChunks.push(line)
                onLine(line)
              })
              proc.stderr.on('data', (chunk) => {
                stderrChunks.push(chunk.toString())
              })
              proc.on('error', (error) => reject(new Error(`docker exec failed: ${error.message}`)))
              proc.on('close', (code) => {
                resolve({
                  stdout: stdoutChunks.join('\n'),
                  stderr: stderrChunks.join(''),
                  exitCode: code ?? 0,
                })
              })
            })
          }

          return new Promise((resolve, reject) => {
            execFile('docker', args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
              if (error && (error as NodeJS.ErrnoException).code === undefined) {
                reject(new Error(`docker exec failed: ${error.message}`))
                return
              }
              resolve({
                stdout: stdout.toString(),
                stderr: stderr.toString(),
                exitCode: typeof error?.code === 'number' ? error.code : 0,
              })
            })
          })
        },
        copyFileIn: (hostPath, sandboxPath) =>
          new Promise((resolve, reject) => {
            execFile('docker', ['cp', hostPath, `${containerName}:${sandboxPath}`], (error) =>
              error ? reject(new Error(`docker cp (in) failed: ${error.message}`)) : resolve(),
            )
          }),
        copyFileOut: (sandboxPath, hostPath) =>
          new Promise((resolve, reject) => {
            execFile('docker', ['cp', `${containerName}:${sandboxPath}`, hostPath], (error) =>
              error ? reject(new Error(`docker cp (out) failed: ${error.message}`)) : resolve(),
            )
          }),
        close: async () => {
          process.removeListener('exit', onExit)
          process.removeListener('SIGINT', onSignal)
          process.removeListener('SIGTERM', onSignal)
          await execFileAsync('docker', ['stop', containerName]).catch(() => {})
          await execFileAsync('docker', ['rm', containerName]).catch(() => {})
        },
      }
      return handle
    },
  })

/**
 * Remove named volumes by name. Idempotent: missing or in-use volumes log a
 * warning and are otherwise ignored.
 */
export async function removeVolumes(volumeNames: readonly string[]): Promise<void> {
  for (const name of volumeNames) {
    try {
      await execFileAsync('docker', ['volume', 'rm', name])
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn(`docker volume rm ${name} failed (non-fatal): ${msg}`)
    }
  }
}

/**
 * Stable per-issue volume names for the persistent caches we mount into the
 * sandbox. Names follow Docker's identifier rules ([a-z0-9_.-]).
 */
export function issueVolumes(
  repoName: string,
  issueNumber: number,
): { readonly nodeModules: string; readonly pnpmStore: string } {
  const slug = sanitize(repoName)
  return {
    nodeModules: `sandcastle-${slug}-issue-${issueNumber}-node-modules`,
    pnpmStore: `sandcastle-${slug}-issue-${issueNumber}-pnpm-store`,
  }
}

/** Stable per-feature-branch volume names, scoped to the merge agent's sandbox. */
export function featureVolumes(
  repoName: string,
  prdNumber: number,
): { readonly nodeModules: string; readonly pnpmStore: string } {
  const slug = sanitize(repoName)
  return {
    nodeModules: `sandcastle-${slug}-prd-${prdNumber}-node-modules`,
    pnpmStore: `sandcastle-${slug}-prd-${prdNumber}-pnpm-store`,
  }
}

function sanitize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9_.-]/g, '-')
}

/**
 * Standard `volumes` array for a sandbox: `node_modules/` and `.pnpm-store/`
 * mounted at their conventional workspace paths.
 */
export function workspaceVolumes(volumes: {
  nodeModules: string
  pnpmStore: string
}): VolumeMount[] {
  return [
    { volumeName: volumes.nodeModules, sandboxPath: '/home/agent/workspace/node_modules' },
    { volumeName: volumes.pnpmStore, sandboxPath: '/home/agent/workspace/.pnpm-store' },
  ]
}
