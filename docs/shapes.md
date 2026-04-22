# Shape System

This document explains how shapes work and how to add a new shape type.

## Overview

A **shape** is a single drawable element in the document. All shapes share a common base (id, name, visibility, style) and add type-specific geometry.

Shapes are stored as a **discriminated union** in `src/types/shapes.ts`, keyed on `type`. This gives us:
- Exhaustive pattern matching (TS will complain if you miss a case)
- Zod runtime validation on load/paste/import
- A single place to see every shape the app supports

## The Shape Contract

Every shape must support these operations:

| Operation      | Where                                      | Required |
| -------------- | ------------------------------------------ | -------- |
| Schema         | `src/types/shapes.ts`                      | Yes      |
| Render         | `src/features/canvas/renderers/`           | Yes      |
| Bounding box   | `src/lib/svg/bbox.ts`                      | Yes      |
| Translate      | `src/lib/svg/transform.ts`                 | Yes      |
| Serialize      | `src/features/export/serializers/`         | Yes      |
| Properties UI  | `src/features/properties/editors/`         | Yes      |
| Drawing tool   | `src/features/toolbar/tools/`              | Optional |
| Hit testing    | `src/lib/svg/hitTest.ts`                   | Yes      |

If any of these is missing, `npm run check` should fail via the exhaustiveness check (see "Exhaustiveness" below).

## Existing Shape Types

- **`rect`** — rectangle with optional corner radius (`rx`)
- **`circle`** — circle with center + radius
- **`ellipse`** — ellipse with center + `rx`/`ry`
- **`line`** — two-point line
- **`path`** — arbitrary SVG path data (`d` string)
- **`group`** — container holding child shape ids (no geometry of its own)

## Adding a New Shape Type: Walkthrough

Let's add a `polygon` shape (N-point closed polyline).

### 1. Define the Schema

`src/types/shapes.ts`:

```ts
export const PolygonShape = ShapeBase.extend({
  type: z.literal('polygon'),
  points: z.array(Vec2).min(3),   // at least a triangle
});

export const Shape = z.discriminatedUnion('type', [
  RectShape,
  CircleShape,
  EllipseShape,
  LineShape,
  PathShape,
  GroupShape,
  PolygonShape,    // <-- add here
]);
```

That single addition to the union is what makes the exhaustiveness checks fire everywhere else. TypeScript will now yell at every `switch(shape.type)` that doesn't handle `polygon`. Walk through the compile errors — each one is a file you need to touch.

### 2. Add a Renderer

`src/features/canvas/renderers/PolygonRenderer.tsx`:

```tsx
import type { Polygon } from '@/types/shapes';

export function PolygonRenderer({ shape }: { shape: Polygon }) {
  const points = shape.points.map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <polygon
      points={points}
      fill={shape.fill ?? 'none'}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
    />
  );
}
```

Register it in `src/features/canvas/renderers/ShapeRenderer.tsx`:

```tsx
switch (shape.type) {
  case 'rect':    return <RectRenderer shape={shape} />;
  case 'circle':  return <CircleRenderer shape={shape} />;
  // ...
  case 'polygon': return <PolygonRenderer shape={shape} />;
  default:        return assertNever(shape);
}
```

### 3. Bounding Box

`src/lib/svg/bbox.ts`:

```ts
export function bboxOf(shape: Shape): Rect {
  switch (shape.type) {
    // ...
    case 'polygon': {
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      return {
        x: minX, y: minY,
        width: Math.max(...xs) - minX,
        height: Math.max(...ys) - minY,
      };
    }
    default: return assertNever(shape);
  }
}
```

### 4. Translate (for Move commands)

`src/lib/svg/transform.ts`:

```ts
export function translate(shape: Shape, dx: number, dy: number): Shape {
  switch (shape.type) {
    // ...
    case 'polygon':
      return {
        ...shape,
        points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      };
    default: return assertNever(shape);
  }
}
```

### 5. Serialize for Export

`src/features/export/serializers/polygon.ts`:

```ts
import type { Polygon } from '@/types/shapes';
import { serializeStyle } from './style';

export function serializePolygon(shape: Polygon): string {
  const points = shape.points.map((p) => `${p.x},${p.y}`).join(' ');
  return `<polygon points="${points}"${serializeStyle(shape)} />`;
}
```

Register in `src/features/export/serialize.ts`:

```ts
switch (shape.type) {
  // ...
  case 'polygon': return serializePolygon(shape);
  default: return assertNever(shape);
}
```

### 6. Properties Editor

`src/features/properties/editors/PolygonEditor.tsx`:

```tsx
export function PolygonEditor({ shape }: { shape: Polygon }) {
  return (
    <>
      <PointsEditor points={shape.points} shapeId={shape.id} />
      <StyleEditor shape={shape} />
    </>
  );
}
```

Register in the editor switch (`PropertiesPanel.tsx`).

### 7. Hit Testing

`src/lib/svg/hitTest.ts` — use ray casting or point-in-polygon:

```ts
case 'polygon':
  return pointInPolygon(point, shape.points);
```

### 8. (Optional) Drawing Tool

`src/features/toolbar/tools/PolygonTool.ts` — handles pointer events to let users draw polygons click-by-click. Register in `src/features/toolbar/tools/index.ts`.

### 9. Tests

At minimum, add:
- `src/types/shapes.test.ts` — schema validation (valid + invalid inputs)
- `src/lib/svg/bbox.test.ts` — bbox correctness
- `src/lib/svg/transform.test.ts` — translate preserves invariants
- `src/features/export/serializers/polygon.test.ts` — golden SVG output

### 10. Verify

```bash
npm run check
```

If anything's missing, TypeScript or the tests will flag it. **Don't suppress errors with `as any` or `@ts-ignore`** — they're the safety net.

## Exhaustiveness

We use an `assertNever` helper in every shape switch:

```ts
// src/lib/util/assertNever.ts
export function assertNever(x: never): never {
  throw new Error(`Unhandled shape type: ${JSON.stringify(x)}`);
}
```

When you add a new shape type, every call site using `assertNever` becomes a compile error until you handle the new case. This is the **single most important guardrail** in the codebase — it's how we guarantee every shape supports every operation.

**Never cast away a `never` error.** If you see one after adding a shape type, that's TypeScript telling you exactly which file needs an update.

## Shape ID Strategy

- IDs are ULIDs (via the `ulid` package) — sortable, collision-resistant, URL-safe.
- IDs are generated **once** at creation time and never change, even across copy/paste or undo/redo.
- Groups reference children by id — never by index — so reordering is safe.

## Groups: A Special Case

Groups hold `childIds: string[]` and have no geometry. Their bbox is the union of child bboxes. When translating a group:

```ts
case 'group':
  // translate each child by (dx, dy), group itself doesn't move
  return shape;  // group's data doesn't change — children do
```

The group command fans out to child-move commands, batched into one history entry via `beginBatch` / `endBatch` (see `src/store/commands/batch.ts`).

## Anti-Patterns

- ❌ **Don't add type-specific fields to `ShapeBase`.** If only one shape needs it, put it on that shape.
- ❌ **Don't branch on `type` inside components.** Dispatch to a renderer component instead.
- ❌ **Don't mutate shape objects.** Always return new ones (Immer handles this inside commands).
- ❌ **Don't store derived data** (like bbox) in the shape. Compute it from geometry.
- ❌ **Don't skip the schema.** If a shape can exist at runtime, it must have a Zod schema — that's how we validate imports and pasted SVG.

## Importing External SVG

When users paste or import SVG, we parse with `DOMParser`, walk the tree, and convert each element into our shape union. Unknown elements become `path` shapes (we convert rects/ellipses to their path equivalent via `svgpath`). See `src/features/import/parseSvg.ts`.

This means: if you add a shape type that SVG doesn't natively have (e.g., `star`), you must also decide how it **exports** (likely as a `<path>`) and how it **imports** (likely stays as a `path` — we don't try to reverse-engineer stars from paths).
