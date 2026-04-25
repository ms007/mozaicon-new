import type { Meta, StoryObj } from '@storybook/react'

import { DevSidebar } from './DevSidebar'

const meta: Meta<typeof DevSidebar> = {
  title: 'Semantic/DevSidebar',
  component: DevSidebar,
}

export default meta
type Story = StoryObj<typeof DevSidebar>

export const Default: Story = {}
