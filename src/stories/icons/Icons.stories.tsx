import type { Meta, StoryObj } from '@storybook/react'

import { headerIcons, type IconEntry, toolIcons } from '@/icons'

function IconCatalog() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <section>
        <h2 style={{ marginBottom: '1rem' }}>Tool Icons (stroke 1.3)</h2>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {toolIcons.map((entry: IconEntry) => (
            <figure
              key={entry.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <entry.Component width={28} height={28} />
              <figcaption style={{ fontSize: '0.75rem' }}>{entry.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section>
        <h2 style={{ marginBottom: '1rem' }}>Header Icons (stroke 1.5)</h2>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {headerIcons.map((entry: IconEntry) => (
            <figure
              key={entry.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <entry.Component width={28} height={28} />
              <figcaption style={{ fontSize: '0.75rem' }}>{entry.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  )
}

const meta: Meta<typeof IconCatalog> = {
  title: 'Icons/Catalog',
  component: IconCatalog,
}

export default meta
type Story = StoryObj<typeof IconCatalog>

export const AllIcons: Story = {}
