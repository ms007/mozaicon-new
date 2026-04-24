import { execFileSync } from 'node:child_process'

export interface BlockedByRef {
  number: number
  state: 'OPEN' | 'CLOSED'
}

export interface Issue {
  number: number
  id: string // GraphQL node ID
  title: string
  body: string
  url: string
  state: 'OPEN' | 'CLOSED'
  labels: string[]
  blockedBy: BlockedByRef[]
  status: string // Project v2 Status option name, "Todo" if not yet on board
}

export interface ProjectInfo {
  projectId: string
  statusFieldId: string
  todoOptionId: string
  inProgressOptionId: string
  inReviewOptionId: string
  doneOptionId: string
}

function ghArgs(args: string[]): string {
  return execFileSync('gh', args, { encoding: 'utf-8', maxBuffer: 10_485_760 })
}

function ghJson<T = unknown>(args: string[]): T {
  const raw = ghArgs(args)
  return JSON.parse(raw) as T
}

function graphql<T = unknown>(query: string, variables: Record<string, string | number>): T {
  const args = ['api', 'graphql', '-f', `query=${query}`]
  for (const [k, v] of Object.entries(variables)) {
    if (typeof v === 'number') {
      args.push('-F', `${k}=${v}`)
    } else {
      args.push('-f', `${k}=${v}`)
    }
  }
  return ghJson<T>(args)
}

export function getRepoInfo(): { owner: string; name: string } {
  const owner = ghArgs(['repo', 'view', '--json', 'owner', '-q', '.owner.login']).trim()
  const name = ghArgs(['repo', 'view', '--json', 'name', '-q', '.name']).trim()
  return { owner, name }
}

export function resolveProject(owner: string, name: string): ProjectInfo {
  const query = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        projectsV2(first: 20) {
          nodes {
            id title
            fields(first: 30) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id name
                  options { id name }
                }
              }
            }
          }
        }
      }
    }
  `
  const result = graphql<{
    data: {
      repository: {
        projectsV2: {
          nodes: Array<{
            id: string
            title: string
            fields: {
              nodes: Array<{
                id?: string
                name?: string
                options?: Array<{ id: string; name: string }>
              }>
            }
          }>
        }
      }
    }
  }>(query, { owner, name })

  for (const project of result.data.repository.projectsV2.nodes) {
    for (const field of project.fields.nodes) {
      if (field?.name?.toLowerCase() === 'status' && field.options) {
        const opts: Record<string, string> = {}
        for (const o of field.options) {
          opts[o.name.toLowerCase()] = o.id
        }
        if (opts['todo'] && opts['in progress'] && opts['in review'] && opts['done'] && field.id) {
          return {
            projectId: project.id,
            statusFieldId: field.id,
            todoOptionId: opts['todo'],
            inProgressOptionId: opts['in progress'],
            inReviewOptionId: opts['in review'],
            doneOptionId: opts['done'],
          }
        }
      }
    }
  }

  throw new Error(
    'No Project v2 with a Status field (Todo/In Progress/In Review/Done) linked to this repo.',
  )
}

type GqlIssue = {
  id: string
  number: number
  title: string
  body: string
  url: string
  state: 'OPEN' | 'CLOSED'
  labels: { nodes: Array<{ name: string }> }
  blockedBy: { nodes: Array<{ number: number; state: 'OPEN' | 'CLOSED' }> }
  projectItems?: {
    nodes: Array<{
      project: { id: string }
      fieldValueByName?: { name?: string }
    }>
  }
}

function toIssue(i: GqlIssue, projectId?: string): Issue {
  let status = 'Todo'
  if (projectId && i.projectItems) {
    const match = i.projectItems.nodes.find((pi) => pi.project?.id === projectId)
    status = match?.fieldValueByName?.name ?? 'Todo'
  }
  return {
    number: i.number,
    id: i.id,
    title: i.title,
    body: i.body,
    url: i.url,
    state: i.state,
    labels: i.labels.nodes.map((n) => n.name),
    blockedBy: i.blockedBy.nodes.map((n) => ({ number: n.number, state: n.state })),
    status,
  }
}

export function getPrd(owner: string, name: string, number: number): Issue {
  const query = `
    query($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        issue(number: $number) {
          id number title body url state
          labels(first: 20) { nodes { name } }
          blockedBy(first: 50) { nodes { number state } }
        }
      }
    }
  `
  const r = graphql<{
    data: { repository: { issue: GqlIssue | null } }
  }>(query, { owner, name, number })
  const i = r.data.repository.issue
  if (!i) throw new Error(`Issue #${number} not found.`)
  return toIssue(i)
}

export function getSubIssues(
  owner: string,
  name: string,
  prdNumber: number,
  projectId: string,
): Issue[] {
  const query = `
    query($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        issue(number: $number) {
          subIssues(first: 100) {
            nodes {
              id number title body url state
              labels(first: 20) { nodes { name } }
              blockedBy(first: 50) { nodes { number state } }
              projectItems(first: 10) {
                nodes {
                  project { id }
                  fieldValueByName(name: "Status") {
                    ... on ProjectV2ItemFieldSingleSelectValue { name }
                  }
                }
              }
            }
          }
        }
      }
    }
  `
  const r = graphql<{
    data: {
      repository: {
        issue: { subIssues: { nodes: GqlIssue[] } } | null
      }
    }
  }>(query, { owner, name, number: prdNumber })
  const nodes = r.data.repository.issue?.subIssues.nodes ?? []
  return nodes.map((n) => toIssue(n, projectId))
}

export function getReadyIssues(subIssues: Issue[]): Issue[] {
  return subIssues.filter(
    (i) =>
      i.state === 'OPEN' &&
      i.labels.includes('sandcastle') &&
      (i.status === 'Todo' || i.status === '') &&
      i.blockedBy.every((b) => b.state === 'CLOSED'),
  )
}

export function getInProgressIssues(subIssues: Issue[]): Issue[] {
  return subIssues.filter(
    (i) => i.state === 'OPEN' && i.labels.includes('sandcastle') && i.status === 'In Progress',
  )
}

/**
 * Return open blocker issue numbers that prevent sandcastle-labeled sub-issues
 * from starting. Used for deadlock reporting — "warten auf #X".
 */
export function findBlockingIssueNumbers(subIssues: Issue[]): number[] {
  const blockers = new Set<number>()
  for (const i of subIssues) {
    if (
      i.state === 'OPEN' &&
      i.labels.includes('sandcastle') &&
      (i.status === 'Todo' || i.status === '')
    ) {
      for (const b of i.blockedBy) {
        if (b.state === 'OPEN') blockers.add(b.number)
      }
    }
  }
  return Array.from(blockers).sort((a, b) => a - b)
}

export function addIssueToProject(projectId: string, issueNodeId: string): string {
  const query = `mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}`
  const r = graphql<{
    data: { addProjectV2ItemById: { item: { id: string } } }
  }>(query, { p: projectId, c: issueNodeId })
  return r.data.addProjectV2ItemById.item.id
}

export function setProjectItemStatus(
  projectId: string,
  itemId: string,
  statusFieldId: string,
  optionId: string,
): void {
  const query = `mutation($p:ID!,$i:ID!,$f:ID!,$o:String!){updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:{singleSelectOptionId:$o}}){projectV2Item{id}}}`
  graphql(query, { p: projectId, i: itemId, f: statusFieldId, o: optionId })
}

/**
 * Idempotent: adds the issue to the project if not already there, then sets status.
 * Uses `addProjectV2ItemById` which GitHub documents as returning the existing
 * item if the issue is already on the project.
 */
export function setIssueStatus(project: ProjectInfo, issueNodeId: string, optionId: string): void {
  const itemId = addIssueToProject(project.projectId, issueNodeId)
  setProjectItemStatus(project.projectId, itemId, project.statusFieldId, optionId)
}

export function closeIssue(number: number, comment?: string): void {
  const args = ['issue', 'close', String(number)]
  if (comment) args.push('--comment', comment)
  execFileSync('gh', args, { stdio: 'inherit' })
}

export function createPr(
  baseBranch: string,
  headBranch: string,
  title: string,
  body: string,
): string {
  const url = execFileSync(
    'gh',
    ['pr', 'create', '--base', baseBranch, '--head', headBranch, '--title', title, '--body', body],
    { encoding: 'utf-8' },
  ).trim()
  return url
}

export function prExistsForBranch(headBranch: string): string | null {
  const raw = ghArgs(['pr', 'list', '--head', headBranch, '--state', 'open', '--json', 'url'])
  const list = JSON.parse(raw) as Array<{ url: string }>
  return list[0]?.url ?? null
}

/** Extract a section under a `## <heading>` markdown header, until the next `##`. */
export function extractSection(body: string, heading: string): string {
  const re = new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s|\\Z)`, 'mi')
  const m = body.match(re)
  return m ? m[1].trim() : ''
}
