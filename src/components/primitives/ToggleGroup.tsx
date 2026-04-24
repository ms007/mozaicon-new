// Pass-through wrapper for the shadcn ToggleGroup primitive (Pattern 1 — see
// docs/ui-primitives.md). No behavior added; DS tokens in index.css retint it.
//
// Named re-exports (not `export *`) so react-refresh can statically see what
// leaves this module.
export { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
