import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TokenTable } from './TokenTable'

afterEach(() => {
  document.documentElement.style.cssText = ''
  document.documentElement.className = ''
})

describe('TokenTable', () => {
  it('renders a swatch row for each token', async () => {
    document.documentElement.style.setProperty('--bg', 'oklch(1 0 0)')
    document.documentElement.style.setProperty('--fg', 'oklch(0 0 0)')
    render(
      <TokenTable
        tokens={[
          { variable: '--bg', label: 'Background' },
          { variable: '--fg', label: 'Foreground' },
        ]}
      />,
    )
    await waitFor(() => {
      expect(screen.getByText('Background')).toBeInTheDocument()
      expect(screen.getByText('Foreground')).toBeInTheDocument()
      expect(screen.getByText('oklch(1 0 0)')).toBeInTheDocument()
      expect(screen.getByText('oklch(0 0 0)')).toBeInTheDocument()
    })
  })

  it('shows fallback for absent variables', async () => {
    render(<TokenTable tokens={[{ variable: '--missing', label: 'Missing' }]} />)
    await waitFor(() => {
      expect(screen.getByText('(not set)')).toBeInTheDocument()
    })
  })

  it('updates when .dark class is applied to an ancestor', async () => {
    document.documentElement.style.setProperty('--bg', 'oklch(1 0 0)')
    render(<TokenTable tokens={[{ variable: '--bg', label: 'Background' }]} />)
    await waitFor(() => {
      expect(screen.getByText('oklch(1 0 0)')).toBeInTheDocument()
    })

    document.documentElement.style.setProperty('--bg', 'oklch(0.141 0.005 285.8)')
    document.documentElement.classList.add('dark')

    await waitFor(() => {
      expect(screen.getByText('oklch(0.141 0.005 285.8)')).toBeInTheDocument()
    })
  })
})
