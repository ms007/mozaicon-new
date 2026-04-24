# Coding Standards

Cross-cutting rules that apply to **every** slice. Project-specific architecture
lives in `CLAUDE.md` and `docs/*`; this file covers test quality, interface
design, and correctness habits that both `implement.md` and `review.md` lean on.

---

## Testing

### Core Principle

Tests verify **behavior through public interfaces**, not implementation details.
Code can be refactored entirely; tests shouldn't break unless behavior changed.

### Good tests

Integration-style tests that exercise real code paths through the public API.
They describe _what_ the system does, not _how_.

```ts
// GOOD: observable behavior through the public interface
it('moves a rect by dx/dy', () => {
  const store = makeStore([rect({ id: 'r1', x: 10, y: 10 })])
  store.set(moveShapeCommand, { id: 'r1', dx: 5, dy: 7 })
  expect(store.get(documentAtom).shapes[0]).toMatchObject({ x: 15, y: 17 })
})
```

- Assert on observable state (`documentAtom`, `selectedShapesAtom`, rendered DOM).
- One logical assertion per test.
- Test name describes WHAT (`'moves a rect by dx/dy'`), not HOW
  (`'calls set on shapesAtom'`).

### Bad tests

```ts
// BAD: mocks an internal collaborator, asserts on call wiring
it('calls shapesAtom setter', () => {
  const spy = vi.spyOn(shapesAtom, 'write')
  store.set(moveShapeCommand, { id: 'r1', dx: 5, dy: 5 })
  expect(spy).toHaveBeenCalled()
})

// BAD: snapshots a React tree
expect(container).toMatchSnapshot()
```

Red flags:

- Mocking your own atoms, commands, or modules.
- Asserting on call counts or order of internal calls.
- Test breaks on a refactor that didn't change behavior.
- Snapshots of React component trees (noisy, break on trivia).

### Mocking — at system boundaries only

Mock only things you don't own:

- Time and randomness (`vi.useFakeTimers`, seeded PRNG).
- `IndexedDB` / Dexie when the real instance would be impractical.
- `file-saver`, `navigator.clipboard`, `window.matchMedia`.

**Never mock your own atoms, commands, hooks, or lib functions.** If a unit is
hard to test without mocking internals, the interface is wrong — redesign it.

For store tests, use a real `createStore()` seeded with state. No mocks, no
spies on atoms. See `docs/testing.md` → "Atoms and Commands" for the pattern.

### TDD — vertical slices (RGR)

One test → one impl → repeat. **Do not** write all tests first, then all
implementation — that produces tests that verify imagined behavior and aren't
sensitive to real changes.

```
RED → GREEN: test1 → impl1
RED → GREEN: test2 → impl2
RED → GREEN: test3 → impl3
REFACTOR    (only while GREEN)
```

Never refactor while RED — get to GREEN first.

### Mozaicon-specific testing invariants

Every non-trivial slice should consider these before the commit:

- **Commands:** happy path + no-op (unknown id, empty selection) + undo/redo
  round-trip. The three together catch ~90 % of command bugs.
- **SVG serializer changes:** serialize → parse → serialize must be byte-stable.
  See `docs/testing.md` → "Round-Trip Tests".
- **Export changes:** if output bytes change, update the golden fixture
  intentionally and review the diff. Never edit a fixture to make a test pass
  without understanding why it moved.
- **Shape-type changes:** let `assertNever` flag missed call sites — don't
  silence it. That exhaustiveness check is the test.

---

## Interface design

### Prefer deep modules

Small public surface, complex implementation hidden behind it. A command that
takes `{ id, dx, dy }` and internally handles clamping, history, and selection
invalidation is a deep module. A command that exposes `pushHistory`, `clamp`,
`updatePosition` as separate calls is shallow — callers must know the order.

When designing a new command/hook/lib function, ask:

- Can I reduce the number of exported methods?
- Can I simplify the parameter list?
- Can I hide more complexity inside?

### Design for testability

1. **Accept dependencies, don't create them.** Pass `store`, time, or random
   sources in — don't construct them inside the function.
2. **Return results, don't mutate.** A function that returns the new value is
   easier to test than one that mutates. Commands are the exception (they
   write atoms by design), but their inputs should be pure data.
3. **Small surface area.** Fewer exports = fewer tests needed = simpler setup.

### Optional parameters are a source of bugs

Scrutinize them heavily. Every `?:` is a path that a caller might forget to
pass, and a future bug where the default silently kicks in. Prioritize
correctness over backwards compatibility:

- Prefer required params with an explicit `undefined`/`null` where "absent"
  matters.
- If a default exists, it must be the safe choice for 100 % of callers — not
  just the common case.
- Split a function with many optional params into two functions before reaching
  for a config object.

---

## TypeScript

- **No `any`. No `@ts-ignore`** without a comment explaining the specific
  reason and a link to a tracking issue if it isn't obvious.
- **Zod at boundaries.** Validate anything crossing a system boundary
  (IndexedDB, file import, clipboard paste, URL params) with a Zod schema and
  derive the TS type via `z.infer<>`. Inside the app, trust your types.
- **Discriminated unions are exhaustive.** Always switch on the discriminant
  and use `assertNever` in the default branch — let the compiler tell you
  where new shape types need work.
- **Prefer `readonly` and `as const`** for data that shouldn't mutate. Mutation
  should be visible at the call site.

---

## Scope discipline

- One issue = one slice = one commit. If you notice an unrelated bug or
  cleanup, leave a note on the issue (or open a new one); don't fold it into
  this slice.
- Don't change public interfaces "while you're in there". A rename touching
  20 files belongs in its own PR.
- Refactors that don't change behavior go in a separate commit (`refactor:`)
  from behavior changes (`feat:`/`fix:`). In Sandcastle's workflow that means
  the review step's commit, not the implement step's.
