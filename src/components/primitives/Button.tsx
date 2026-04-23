// Pass-through wrapper for the shadcn Button primitive.
//
// App code must import from here (not from @/components/ui/button) so that
// when shadcn is re-generated, we only need to reconcile one file. Re-exports
// are named (not `export *`) so react-refresh can statically see what leaves
// this module.
export { Button, buttonVariants } from '@/components/ui/button'
