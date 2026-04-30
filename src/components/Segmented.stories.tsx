import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Segmented, type SegmentedOption } from './Segmented'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

const meta = {
  title: 'Components/Segmented',
  component: Segmented,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Segmented>

export default meta
type Story = StoryObj<typeof meta>

const twoOptions: SegmentedOption[] = [
  { value: 'fill', label: 'Fill' },
  { value: 'stroke', label: 'Stroke' },
]

const threeOptions: SegmentedOption[] = [
  { value: 'design', label: 'Design' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'inspect', label: 'Inspect' },
]

const fourOptions: SegmentedOption[] = [
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'MD' },
  { value: 'lg', label: 'LG' },
]

export const TwoSegments: Story = {
  args: {
    options: twoOptions,
    value: 'fill',
    onChange: noop,
    'aria-label': 'Style mode',
  },
}

export const ThreeSegments: Story = {
  args: {
    options: threeOptions,
    value: 'design',
    onChange: noop,
    'aria-label': 'Editor mode',
  },
}

export const FourSegments: Story = {
  args: {
    options: fourOptions,
    value: 'md',
    onChange: noop,
    'aria-label': 'Size',
  },
}

function InteractiveSegmented() {
  const [value, setValue] = useState('design')
  return (
    <Segmented options={threeOptions} value={value} onChange={setValue} aria-label="Editor mode" />
  )
}

export const Interactive: Story = {
  args: {
    options: threeOptions,
    value: 'design',
    onChange: noop,
    'aria-label': 'Editor mode',
  },
  render: () => <InteractiveSegmented />,
}

export const SecondSelected: Story = {
  args: {
    options: threeOptions,
    value: 'prototype',
    onChange: noop,
    'aria-label': 'Editor mode',
  },
}
