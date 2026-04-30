import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Swatch } from './Swatch'

const meta = {
  title: 'Components/Swatch',
  component: Swatch,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Swatch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { color: '#3b82f6' },
}

export const Active: Story = {
  args: { color: '#3b82f6', active: true },
}

export const Disabled: Story = {
  args: { color: '#3b82f6', disabled: true },
}

export const DarkColor: Story = {
  args: { color: '#1e293b' },
}

export const LightColor: Story = {
  args: { color: '#fef9c3' },
}

export const White: Story = {
  args: { color: '#ffffff' },
}

export const Black: Story = {
  args: { color: '#000000', active: true },
}

const paletteColors = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#000000',
  '#ffffff',
]

function PaletteSwatches() {
  const [selected, setSelected] = useState('#3b82f6')
  return (
    <div className="flex flex-wrap gap-1.5">
      {paletteColors.map((c) => (
        <Swatch
          key={c}
          color={c}
          active={c === selected}
          onSelect={() => {
            setSelected(c)
          }}
        />
      ))}
    </div>
  )
}

export const Palette: Story = {
  args: { color: '#3b82f6' },
  render: () => <PaletteSwatches />,
}
