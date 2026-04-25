import type { Meta, StoryObj } from '@storybook/react'

import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: 'Enter value…',
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: '128',
  },
}

export const Disabled: Story = {
  args: {
    defaultValue: '64',
    disabled: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label htmlFor="grid-size" style={{ fontSize: 12 }}>
        Grid size
      </label>
      <Input id="grid-size" defaultValue="16" style={{ width: 80 }} />
    </div>
  ),
}
