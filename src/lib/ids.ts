import { ulid } from 'ulid'

// Wrapped so tests can swap in deterministic ids without a codemod.
export function newId(): string {
  return ulid()
}
