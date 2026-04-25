import type { Meta, StoryObj } from '@storybook/react'

import { Swatch } from './Swatch'

const meta: Meta<typeof Swatch> = {
  title: 'Semantic/Swatch',
  component: Swatch,
  args: {
    color: '#4f46e5',
  },
}

export default meta
type Story = StoryObj<typeof Swatch>

export const Default: Story = {}

export const Active: Story = {
  args: {
    active: true,
  },
}

export const LightColor: Story = {
  args: {
    color: '#fef08a',
  },
}

export const DarkColor: Story = {
  args: {
    color: '#1e1b4b',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const Palette: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 4 }}>
      <Swatch color="#ef4444" />
      <Swatch color="#f97316" />
      <Swatch color="#eab308" />
      <Swatch color="#22c55e" />
      <Swatch color="#3b82f6" />
      <Swatch color="#8b5cf6" active />
    </div>
  ),
}
