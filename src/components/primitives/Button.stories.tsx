import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  args: {
    children: 'Button',
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {}

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Export SVG',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Cancel',
  },
}

export const Pressed: Story = {
  args: {
    pressed: true,
    children: 'Toggle',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
}

export const IconSize: Story = {
  args: {
    size: 'icon',
    children: '✦',
    'aria-label': 'Star',
  },
}
