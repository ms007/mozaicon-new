import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SpacingRow } from './SpacingRow'

afterEach(() => {
  document.documentElement.style.cssText = ''
  document.documentElement.className = ''
})

describe('SpacingRow', () => {
  it('renders the computed spacing for a given scale', async () => {
    document.documentElement.style.setProperty('--spacing', '0.25rem')
    render(<SpacingRow scale={4} />)
    await waitFor(() => {
      expect(screen.getByText('4 × 0.25rem')).toBeInTheDocument()
    })
  })

  it('shows fallback when --spacing is absent', async () => {
    render(<SpacingRow scale={4} />)
    await waitFor(() => {
      expect(screen.getByText('(not set)')).toBeInTheDocument()
    })
  })

  it('updates when .dark class is applied to an ancestor', async () => {
    document.documentElement.style.setProperty('--spacing', '0.25rem')
    render(<SpacingRow scale={4} />)
    await waitFor(() => {
      expect(screen.getByText('4 × 0.25rem')).toBeInTheDocument()
    })

    document.documentElement.style.setProperty('--spacing', '0.3rem')
    document.documentElement.classList.add('dark')

    await waitFor(() => {
      expect(screen.getByText('4 × 0.3rem')).toBeInTheDocument()
    })
  })
})
