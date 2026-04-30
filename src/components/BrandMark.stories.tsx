import type { Meta, StoryObj } from '@storybook/react-vite'

import { BrandMark } from './BrandMark'

const meta = {
  title: 'Components/BrandMark',
  component: BrandMark,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof BrandMark>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { size: 64, className: 'text-foreground' },
}

export const Small: Story = {
  args: { size: 16, className: 'text-foreground' },
}

export const Large: Story = {
  args: { size: 128, className: 'text-foreground' },
}

export const CustomColor: Story = {
  args: { size: 64, className: 'text-primary' },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <BrandMark size={12} className="text-foreground" />
      <BrandMark size={16} className="text-foreground" />
      <BrandMark size={24} className="text-foreground" />
      <BrandMark size={32} className="text-foreground" />
      <BrandMark size={48} className="text-foreground" />
      <BrandMark size={64} className="text-foreground" />
    </div>
  ),
}
