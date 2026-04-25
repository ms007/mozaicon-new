import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TokenSwatch } from './TokenSwatch'

afterEach(() => {
  document.documentElement.style.cssText = ''
  document.documentElement.className = ''
})

describe('TokenSwatch', () => {
  it('renders the resolved value for a given CSS variable', async () => {
    document.documentElement.style.setProperty('--primary', 'oklch(0.585 0.233 277.1)')
    render(<TokenSwatch variable="--primary" />)
    await waitFor(() => {
      expect(screen.getByText('oklch(0.585 0.233 277.1)')).toBeInTheDocument()
    })
  })

  it('shows fallback when the variable is absent', async () => {
    render(<TokenSwatch variable="--nonexistent" />)
    await waitFor(() => {
      expect(screen.getByText('(not set)')).toBeInTheDocument()
    })
  })

  it('updates when the .dark class is applied to an ancestor', async () => {
    document.documentElement.style.setProperty('--primary', 'oklch(0.585 0.233 277.1)')
    render(<TokenSwatch variable="--primary" />)
    await waitFor(() => {
      expect(screen.getByText('oklch(0.585 0.233 277.1)')).toBeInTheDocument()
    })

    document.documentElement.style.setProperty('--primary', 'oklch(0.673 0.182 276.9)')
    document.documentElement.classList.add('dark')

    await waitFor(() => {
      expect(screen.getByText('oklch(0.673 0.182 276.9)')).toBeInTheDocument()
    })
  })
})
