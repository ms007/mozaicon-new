import type { Meta, StoryObj } from '@storybook/react'

import { BrandMark } from './BrandMark'

const meta: Meta<typeof BrandMark> = {
  title: 'Semantic/BrandMark',
  component: BrandMark,
}

export default meta
type Story = StoryObj<typeof BrandMark>

export const Default: Story = {}

export const Small: Story = {
  args: {
    size: 12,
  },
}

export const Large: Story = {
  args: {
    size: 32,
  },
}

export const CustomColor: Story = {
  args: {
    size: 24,
    style: { color: 'var(--primary)' },
  },
}
