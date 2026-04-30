import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import type { BranchInfo } from '../git.ts'
import { __testing } from '../orchestrator.ts'
import type { IssueState, RelatedIssue, RelatedIssueWithBody, StatusName } from '../project.ts'

const { buildInitialPhases } = __testing

const branch = (n: number): BranchInfo => ({
  name: `sandcastle/issue-${n}`,
  exists: false,
  aheadOfBase: 0,
  headSha: null,
  commits: [],
})

const child = (n: number, status: StatusName | null, state: IssueState = 'OPEN'): RelatedIssue => ({
  number: n,
  title: `child-${n}`,
  itemId: `item-${n}`,
  status,
  state,
  eligible: status === 'Todo' && state === 'OPEN',
  blockedBy: [],
  blocking: [],
  hasSandcastleLabel: true,
  branch: branch(n),
})

const seed = (
  n: number,
  status: StatusName | null,
  state: IssueState = 'OPEN',
): RelatedIssueWithBody => ({
  ...child(n, status, state),
  body: '',
})

describe('buildInitialPhases — recovery from prior runs', () => {
  it("seeds the seed's phase to 'done' when its project status is Done", () => {
    const phases = buildInitialPhases({ seed: seed(1, 'Done'), children: [] })

    assert.equal(
      phases.get(1),
      'done',
      "Done status on the seed must be recovered as phase 'done'; otherwise the orchestrator re-claims and re-implements an already-shipped issue on restart.",
    )
  })

  it("seeds child phases to 'done' for children already Done on the project board", () => {
    const phases = buildInitialPhases({
      seed: seed(100, 'In Progress'),
      children: [child(2, 'Done'), child(3, 'Todo'), child(4, 'Done')],
    })

    assert.equal(phases.get(2), 'done')
    assert.equal(phases.get(4), 'done')
    // Non-Done children stay unset (default observe() phase = "todo").
    assert.equal(phases.get(3), undefined)
  })

  it("seeds 'promoted' for In Review issues so the reviewer runs without redoing the implementer", () => {
    const phases = buildInitialPhases({
      seed: seed(1, 'In Review'),
      children: [child(2, 'In Review'), child(3, 'Todo')],
    })

    assert.equal(
      phases.get(1),
      'promoted',
      "In Review status must recover as phase 'promoted'; otherwise the orchestrator re-claims the issue, regresses its status to In Progress, and re-runs the implementer instead of picking up where the prior run left off.",
    )
    assert.equal(phases.get(2), 'promoted')
    assert.equal(phases.get(3), undefined)
  })

  it("seeds 'reviewed' for Ready to Merge issues so the next run skips review and merges directly", () => {
    const phases = buildInitialPhases({
      seed: seed(100, 'In Progress'),
      children: [child(2, 'Ready to Merge'), child(3, 'In Review'), child(4, 'Ready to Merge')],
    })

    assert.equal(
      phases.get(2),
      'reviewed',
      "Ready to Merge status must recover as phase 'reviewed'; otherwise the orchestrator re-runs the reviewer on an already-approved issue when a prior run aborts before the merger.",
    )
    assert.equal(phases.get(4), 'reviewed')
    // In Review children stay at 'promoted' — reviewer must run again.
    assert.equal(phases.get(3), 'promoted')
  })

  it('does not pre-seed phases for Todo / In Progress / unboarded issues', () => {
    const phases = buildInitialPhases({
      seed: seed(1, 'Todo'),
      children: [child(2, 'In Progress'), child(3, null)],
    })

    assert.equal(phases.size, 0)
  })

  it("seeds 'done' for CLOSED children regardless of project Status", () => {
    // Reproduces: an issue that was finalized (or hand-closed) on a prior run
    // ends up as state=CLOSED, but its project Status may be left at "In
    // Progress" (or even cleared by a human). Without inspecting state, the
    // recovery falls back to phase=todo and the orchestrator re-claims and
    // re-implements an issue that's already shipped — wasting an agent run on
    // closed work. CLOSED must always recover as 'done'.
    const phases = buildInitialPhases({
      seed: seed(57, 'In Progress'),
      children: [child(61, 'In Progress', 'CLOSED'), child(62, null, 'CLOSED'), child(63, 'Todo')],
    })

    assert.equal(
      phases.get(61),
      'done',
      "CLOSED child must recover as 'done' even when project Status is still 'In Progress' — otherwise the orchestrator re-implements a shipped issue.",
    )
    assert.equal(
      phases.get(62),
      'done',
      "CLOSED child must recover as 'done' even when it has no project Status set.",
    )
    assert.equal(phases.get(63), undefined)
  })

  it("seeds 'done' for a CLOSED seed regardless of project Status", () => {
    const phases = buildInitialPhases({
      seed: seed(1, 'In Progress', 'CLOSED'),
      children: [],
    })

    assert.equal(
      phases.get(1),
      'done',
      "A CLOSED seed must recover as 'done' so the workflow exits without re-running stages.",
    )
  })
})
