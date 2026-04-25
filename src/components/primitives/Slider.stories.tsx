import type { Meta, StoryObj } from '@storybook/react'

import { Slider } from './Slider'

const meta: Meta<typeof Slider> = {
  title: 'Primitives/Slider',
  component: Slider,
  args: {
    min: 0,
    max: 100,
    'aria-label': 'Value',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Slider>

export const Default: Story = {
  args: {
    defaultValue: [50],
  },
}

export const AtMinimum: Story = {
  args: {
    defaultValue: [0],
  },
}

export const AtMaximum: Story = {
  args: {
    defaultValue: [100],
  },
}

export const Disabled: Story = {
  args: {
    defaultValue: [50],
    disabled: true,
  },
}

export const SmallRange: Story = {
  args: {
    min: 1,
    max: 10,
    step: 1,
    defaultValue: [4],
  },
}
