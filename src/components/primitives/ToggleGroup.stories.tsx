import type { Meta, StoryObj } from '@storybook/react'

import { ToggleGroup, ToggleGroupItem } from './ToggleGroup'

const meta: Meta<typeof ToggleGroup> = {
  title: 'Primitives/ToggleGroup',
  component: ToggleGroup,
}

export default meta
type Story = StoryObj<typeof ToggleGroup>

export const Single: Story = {
  args: {
    type: 'single',
    defaultValue: 'center',
    'aria-label': 'Text alignment',
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        L
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        C
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        R
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Multiple: Story = {
  args: {
    type: 'multiple',
    defaultValue: ['bold'],
    'aria-label': 'Text formatting',
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="bold" aria-label="Bold">
        B
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        I
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        U
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Outline: Story = {
  args: {
    type: 'single',
    variant: 'outline',
    defaultValue: 'a',
    'aria-label': 'Option group',
  },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
      <ToggleGroupItem value="c">C</ToggleGroupItem>
    </ToggleGroup>
  ),
}
