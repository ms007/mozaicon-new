import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Segmented, type SegmentedProps } from './Segmented'

const meta: Meta<typeof Segmented> = {
  title: 'Semantic/Segmented',
  component: Segmented,
  args: {
    'aria-label': 'View mode',
  },
}

export default meta
type Story = StoryObj<typeof Segmented>

function SegmentedControlled(props: SegmentedProps) {
  const [value, setValue] = useState(props.value)
  return <Segmented {...props} value={value} onChange={setValue} />
}

const noop = () => undefined

export const TwoOptions: Story = {
  args: {
    options: [
      { value: 'design', label: 'Design' },
      { value: 'code', label: 'Code' },
    ],
    value: 'design',
    onChange: noop,
  },
  render: (args) => <SegmentedControlled {...args} />,
}

export const ThreeOptions: Story = {
  args: {
    options: [
      { value: 'sm', label: 'S' },
      { value: 'md', label: 'M' },
      { value: 'lg', label: 'L' },
    ],
    value: 'md',
    onChange: noop,
  },
  render: (args) => <SegmentedControlled {...args} />,
}

export const ManyOptions: Story = {
  args: {
    options: [
      { value: '1', label: '1×' },
      { value: '2', label: '2×' },
      { value: '3', label: '3×' },
      { value: '4', label: '4×' },
    ],
    value: '1',
    onChange: noop,
  },
  render: (args) => <SegmentedControlled {...args} />,
}
