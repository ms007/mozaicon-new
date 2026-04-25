import type { Meta, StoryObj } from '@storybook/react'
import { createStore, Provider } from 'jotai'

import { viewportAtom } from '@/store/atoms/viewport'

import { StatusBar } from './StatusBar'

function makeStore(x = 0, y = 0, zoom = 1, w = 24, h = 24) {
  const store = createStore()
  store.set(viewportAtom, { x, y, zoom, docSize: { w, h } })
  return store
}

const meta: Meta<typeof StatusBar> = {
  title: 'Features/StatusBar',
  component: StatusBar,
}

export default meta
type Story = StoryObj<typeof StatusBar>

export const Default: Story = {
  decorators: [
    (Story) => (
      <Provider store={makeStore()}>
        <Story />
      </Provider>
    ),
  ],
}

export const PannedAndZoomed: Story = {
  decorators: [
    (Story) => (
      <Provider store={makeStore(14, 9, 3, 24, 24)}>
        <Story />
      </Provider>
    ),
  ],
}

export const LargeDocument: Story = {
  decorators: [
    (Story) => (
      <Provider store={makeStore(256, 128, 0.25, 512, 512)}>
        <Story />
      </Provider>
    ),
  ],
}
