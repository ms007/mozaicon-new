import type { Meta, StoryObj } from '@storybook/react-vite'

import { Icon } from '../../icons/Icon'
import { Button } from './Button'

function PlusIcon() {
  return (
    <Icon aria-hidden>
      <line x1="7" y1="3" x2="7" y2="11" />
      <line x1="3" y1="7" x2="11" y2="7" />
    </Icon>
  )
}

function DownloadIcon() {
  return (
    <Icon aria-hidden>
      <path d="M7 2v8m0 0-3-3m3 3 3-3" />
      <path d="M2 11v1h10v-1" />
    </Icon>
  )
}

function BoldIcon() {
  return (
    <Icon aria-hidden>
      <path d="M4 2h4.5a2.5 2.5 0 0 1 0 5H4V2zm0 5h5a2.5 2.5 0 0 1 0 5H4V7z" />
    </Icon>
  )
}

function TrashIcon() {
  return (
    <Icon aria-hidden>
      <path d="M3 4h8m-6 0V3h4v1m-5 0v7a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" />
    </Icon>
  )
}

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'xs', 'icon', 'icon-sm', 'icon-xs'],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Button' },
}

export const Primary: Story = {
  args: { variant: 'primary', children: 'Export SVG' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Cancel' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete' },
}

export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
}

export const ExtraSmall: Story = {
  args: { size: 'xs', children: 'Tiny' },
}

export const IconOnly: Story = {
  args: { size: 'icon', 'aria-label': 'Add shape', children: <PlusIcon /> },
}

export const IconSmall: Story = {
  args: { size: 'icon-sm', 'aria-label': 'Add shape', children: <PlusIcon /> },
}

export const IconExtraSmall: Story = {
  args: { size: 'icon-xs', 'aria-label': 'Add shape', children: <PlusIcon /> },
}

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: (
      <>
        <DownloadIcon /> Export
      </>
    ),
  },
}

export const Pressed: Story = {
  args: { pressed: true, size: 'icon', 'aria-label': 'Bold', children: <BoldIcon /> },
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">
        <TrashIcon /> Destructive
      </Button>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-3">
      <Button size="default">Default</Button>
      <Button size="sm">Small</Button>
      <Button size="xs">Extra Small</Button>
      <Button size="icon" aria-label="Icon">
        <PlusIcon />
      </Button>
      <Button size="icon-sm" aria-label="Icon small">
        <PlusIcon />
      </Button>
      <Button size="icon-xs" aria-label="Icon extra small">
        <PlusIcon />
      </Button>
    </div>
  ),
}
