**Mozaicon** — a browser-based web app for designing, editing, and exporting SVG icons. Users can draw shapes, manipulate paths, apply styles, and export optimized SVG files.

**Core value prop:** Pixel-perfect icon design with keyboard-first workflow and instant SVG export.

## Required Reading

This file is the entry point. Before making non-trivial changes, read the relevant deep-dive docs:

- **`docs/architecture.md`** — State management, command pattern, rendering pipeline. Read this before touching anything in `src/store/`, `src/features/canvas/`, or adding new commands.
- **`docs/shapes.md`** — How to add or modify shape types. Read this before touching `src/types/shapes.ts` or adding a new shape.
- **`docs/testing.md`** — Testing patterns per layer, golden-file conventions, Jotai test helpers. Read this before writing tests.
- **`docs/ui-primitives.md`** — shadcn vendoring, the `primitives/` wrapper seam, the three wrap patterns. Read this before adding a shadcn primitive or touching anything under `src/components/ui/` or `src/components/primitives/`.

If you're unsure which applies, skim all three — they're short and focused.

## Tech Stack

- **Build:** Vite 5, React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **State:** Jotai (atomic state) + Immer for complex updates
- **UI Primitives:** Radix UI (via shadcn/ui)
- **Canvas/SVG:** Native SVG in JSX + `svgpath` for path math
- **Storage:** Dexie (IndexedDB) for project persistence
- **Export:** SVGO for optimization, `file-saver` for downloads
- **Testing:** Vitest (unit), Playwright (e2e + visual)

## Commands

```bash
pnpm dev         # Start dev server (Vite, port 5173)
pnpm build       # Type-check + production build
pnpm check       # Run tsc + eslint + vitest (use this before committing)
pnpm test        # Vitest watch mode
pnpm test:e2e    # Playwright tests
pnpm lint        # ESLint with --fix
pnpm format      # Prettier
```

**Always run `pnpm check` after making changes.** It's the single source of truth for "does this pass CI".

## Architecture

### Data Flow

```
User Interaction (Canvas/Toolbar)
  → Jotai Atoms (src/store/)
  → React re-render
  → SVG DOM (src/features/canvas/)
  → Export pipeline (src/features/export/)
```

### Key Concepts

- **Document:** The top-level SVG being edited. One per tab.
- **Shape:** A single element (rect, circle, path, group). Each has a stable `id`.
- **Selection:** Array of shape IDs. Multi-select is first-class.
- **Command:** Every mutation goes through a command (for undo/redo). See `src/store/commands/`.

### Folder Structure

```
src/
  features/          # Feature-based slices (prefer editing here)
    canvas/          # SVG rendering + pointer interactions
    toolbar/         # Drawing tools (pen, rect, circle, etc.)
    properties/      # Right-panel property editors
    export/          # SVG serialization + SVGO
    storage/         # Dexie project persistence
  store/             # Jotai atoms + command pattern
    atoms/           # Atom definitions (document, selection, tool, etc.)
      document.ts    # Document atom + derived atoms (shapes, bbox)
      selection.ts   # Selection atom + derived (selectedShapes)
      history.ts     # Undo/redo stack atoms
      tool.ts        # Active tool atom
    commands/        # Undoable mutations (write-only atoms)
    hooks/           # Composed hooks (useDocument, useSelection)
  lib/               # Pure utilities (no React)
    svg/             # Path math, transforms, bbox
    geometry/        # Vec2, matrix, snapping
  components         # Generic ui primitives
  components/ui/     # Generic shadcn/ui primitives
  types/             # Shared TS types + Zod schemas
```

**Rule of thumb:** If it's specific to a feature, put it in `features/<name>/`. If it's reused across features, promote it to `lib/` or `components.

## Conventions

### TypeScript

- **Strict mode is on.** No `any`, no `@ts-ignore` without a comment explaining why.
- **Schemas first:** Define Zod schemas in `src/types/`, derive TS types via `z.infer<>`.
- **Discriminated unions for shapes:** Always check `shape.type` before accessing type-specific fields.

### React

- **Functional components only.** No class components.
- **Hooks naming:** `useX` for custom hooks. For atoms, prefer `useAtom(xAtom)` / `useAtomValue(xAtom)` directly in components rather than wrapping every atom in a hook.
- **No prop drilling past 2 levels** — read from atoms instead.
- **Memoize expensive renders** with `useMemo`/`memo` only when profiled, not preemptively.

### State

- **Atomic design:** Split state into small, focused atoms. Prefer many small atoms over one large one.
- **Derived atoms for computed state:** Use `atom((get) => ...)` instead of recomputing in components.
- **All mutations via commands.** Don't call `set` on primitive atoms from components — dispatch via command atoms in `store/commands/`.
- **Commands are write-only atoms:** `atom(null, (get, set, payload) => ...)`. Keep them pure; side effects go in effect atoms or `useEffect`.
- **Selection is a separate atom from document.** Never store selection inside shape data.
- **Use `atomFamily` for per-shape atoms** when you need fine-grained subscriptions (e.g., one atom per shape for property editors). This avoids re-rendering the whole canvas on a single-shape edit.
- **Use `splitAtom` for list rendering** when the canvas renders many shapes — each child subscribes only to its own atom.
- **Immer integration:** Use `atomWithImmer` from `jotai-immer` for atoms holding deep structures (the document tree).

### Files

- **Keep files under 300 lines.** Split by responsibility when they grow.
- **One component per file.** Name file same as component (`ShapeInspector.tsx`).
- **Co-locate tests:** `Foo.tsx` + `Foo.test.tsx` in the same folder.

### Comments

- **Use comments sparingly.** Prefer self-documenting code: clear names, small functions, explicit types.
- Comment the _why_, not the _what_ — the code already shows what it does.
- Acceptable: non-obvious tradeoffs, workarounds with issue links, TODO/FIXME with context.
- Avoid: restating the obvious, commented-out code, JSDoc on trivially-named functions.

## Testing Strategy

- **Unit tests (Vitest):** All `lib/` functions must have tests. Pure logic = easy to test.
- **Component tests (Vitest + Testing Library):** For components with non-trivial logic.
- **Visual/E2E (Playwright):** For canvas interactions, drag operations, and export correctness.
- **SVG Output Tests:** Snapshot-test the serialized SVG string for export scenarios. See `src/features/export/export.test.ts` for patterns.

**When adding a feature:** write at least one test at the layer where the logic lives (lib > component > e2e).

## Common Tasks

### Adding a new shape type

**First: read `docs/shapes.md` in full.** It contains a step-by-step walkthrough with code examples.

Quick checklist (full details in the doc):

1. Add schema in `src/types/shapes.ts` (extend the discriminated union)
2. Add renderer in `src/features/canvas/renderers/`
3. Add tool in `src/features/toolbar/tools/` if user-drawable
4. Add property editor in `src/features/properties/editors/`
5. Add export serializer in `src/features/export/serializers/`
6. Add bbox + translate + hit test in `src/lib/svg/`
7. Write tests (schema, bbox, export round-trip)

After adding, `pnpm check` will flag any missed call sites via `assertNever`.

### Adding a new command

**First: read `docs/architecture.md`, section "Command Pattern".**

Commands live in `src/store/commands/`. Use the `createCommand` helper — don't write raw write-only atoms. Every command must have at least one test covering the happy path and one no-op case.

### Adding a shadcn primitive

**First: read `docs/ui-primitives.md`.** It covers the wrapper convention and the three wrap patterns in full.

Checklist:

1. `pnpm dlx shadcn@latest add <name>` — writes to `src/components/ui/<name>.tsx` (vendored; don't hand-edit).
2. Create `src/components/primitives/<Name>.tsx` — start with a named-re-export pass-through; upgrade to a composition wrapper or fork only when needed.
3. Import from `@/components/primitives/<Name>` at every call-site. ESLint's `no-restricted-imports` rule blocks `@/components/ui/*` outside `src/components/primitives/**`.
4. `pnpm check`.

### Adding a keyboard shortcut

Shortcuts are centralized in `src/features/shortcuts/bindings.ts`. Add to the registry — don't attach listeners in components.

### Writing tests

**First: read `docs/testing.md`** for layer-specific patterns. Key rules:

- Pure logic → Vitest unit test in the same folder
- Store logic → use `createStore()` with seeded state, not mocks
- SVG output → use golden files in `__fixtures__/`, not inline strings
- UI flows crossing layers → Playwright

### Debugging canvas issues

- Open devtools, inspect the `<svg>` element — the DOM reflects atom state 1:1.
- **Jotai DevTools** (`jotai-devtools`) shows all atom values and updates. Enable in dev mode via `<DevTools />`.
- React DevTools Profiler helps spot unnecessary re-renders — if you see them, the atom is too coarse-grained. Split it.
- Run `pnpm test:e2e --headed` to watch Playwright drive the canvas.

## What NOT to Do

- ❌ Don't manipulate the SVG DOM imperatively (no `ref.current.setAttribute`). React renders it.
- ❌ Don't add a new state management library. Jotai handles everything here.
- ❌ Don't create monolithic atoms holding the entire app state. Split by concern.
- ❌ Don't subscribe to a large atom just to read one field — create a derived atom.
- ❌ Don't use `dangerouslySetInnerHTML` for user SVG content — parse it via DOMParser and validate.
- ❌ Don't bypass the command pattern for "small" changes. Undo/redo depends on it.
- ❌ Don't import from `@/components/ui/*` outside `src/components/primitives/**`. App code goes through the primitives seam; see `docs/ui-primitives.md`. ESLint will flag it.
- ❌ Don't commit without running `pnpm check`.

## MCP Servers Configured

- **Filesystem** — read/write project files
- **Playwright** — browser automation for visual testing
- **GitHub** — PR and issue workflows

## When You're Stuck

1. Re-read the relevant doc from "Required Reading" above — the answer is often there
2. Search existing tests for usage examples (`grep -r "similar thing" src/`)
3. If conventions are unclear, prefer consistency with existing code in `src/features/canvas/` (the most mature feature)
4. If you're about to suppress a TypeScript error, stop — it's almost always pointing to a real missing case

## Definition of Done

A change is done when:

- [ ] `pnpm check` passes
- [ ] New logic has tests
- [ ] No new TypeScript errors or ESLint warnings
- [ ] SVG export still produces valid, optimized output (check `export.test.ts`)
- [ ] Keyboard shortcuts still work (run through `docs/shortcuts.md`)
- [ ] Commit message follows Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.)
