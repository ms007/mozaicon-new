import type { Meta, StoryObj } from '@storybook/react-vite'
import { createStore, Provider } from 'jotai'
import { useMemo } from 'react'

import { DevSidebar } from './DevSidebar'

const meta = {
  title: 'Components/DevSidebar',
  component: DevSidebar,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => {
      const store = useMemo(() => createStore(), [])
      return (
        <Provider store={store}>
          <div className="flex h-screen justify-end">
            <Story />
          </div>
        </Provider>
      )
    },
  ],
} satisfies Meta<typeof DevSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
