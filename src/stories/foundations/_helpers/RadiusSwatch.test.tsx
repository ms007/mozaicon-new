import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { RadiusSwatch } from './RadiusSwatch'

afterEach(() => {
  document.documentElement.style.cssText = ''
  document.documentElement.className = ''
})

describe('RadiusSwatch', () => {
  it('renders the resolved radius for a given CSS variable', async () => {
    document.documentElement.style.setProperty('--radius-md', '4px')
    render(<RadiusSwatch variable="--radius-md" />)
    await waitFor(() => {
      expect(screen.getByText('4px')).toBeInTheDocument()
    })
  })

  it('shows fallback when the variable is absent', async () => {
    render(<RadiusSwatch variable="--radius-nonexistent" />)
    await waitFor(() => {
      expect(screen.getByText('(not set)')).toBeInTheDocument()
    })
  })

  it('updates when .dark class is applied to an ancestor', async () => {
    document.documentElement.style.setProperty('--radius-md', '4px')
    render(<RadiusSwatch variable="--radius-md" />)
    await waitFor(() => {
      expect(screen.getByText('4px')).toBeInTheDocument()
    })

    document.documentElement.style.setProperty('--radius-md', '6px')
    document.documentElement.classList.add('dark')

    await waitFor(() => {
      expect(screen.getByText('6px')).toBeInTheDocument()
    })
  })
})
