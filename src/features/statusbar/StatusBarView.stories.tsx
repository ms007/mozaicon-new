import type { Meta, StoryObj } from '@storybook/react'

import { StatusBarView } from './StatusBarView'

const meta: Meta<typeof StatusBarView> = {
  title: 'Features/StatusBarView',
  component: StatusBarView,
}

export default meta
type Story = StoryObj<typeof StatusBarView>

export const Default: Story = {
  args: {
    x: 0,
    y: 0,
    zoom: 1,
    docWidth: 24,
    docHeight: 24,
  },
}

export const WithCoordinates: Story = {
  args: {
    x: 12,
    y: 8,
    zoom: 1,
    docWidth: 24,
    docHeight: 24,
  },
}

export const ZoomedIn: Story = {
  args: {
    x: 6,
    y: 4,
    zoom: 4,
    docWidth: 24,
    docHeight: 24,
  },
}

export const ZoomedOut: Story = {
  args: {
    x: 0,
    y: 0,
    zoom: 0.5,
    docWidth: 24,
    docHeight: 24,
  },
}

export const LargeDocument: Story = {
  args: {
    x: 100,
    y: 200,
    zoom: 0.25,
    docWidth: 512,
    docHeight: 512,
  },
}
