import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TypeSpecimen } from './TypeSpecimen'

afterEach(() => {
  document.documentElement.style.cssText = ''
  document.documentElement.className = ''
})

describe('TypeSpecimen', () => {
  it('renders the resolved font size for a given CSS variable', async () => {
    document.documentElement.style.setProperty('--text-base', '0.8125rem')
    render(<TypeSpecimen sizeVar="--text-base" />)
    await waitFor(() => {
      expect(screen.getByText('0.8125rem')).toBeInTheDocument()
    })
  })

  it('shows fallback when the variable is absent', async () => {
    render(<TypeSpecimen sizeVar="--text-nonexistent" />)
    await waitFor(() => {
      expect(screen.getByText('(not set)')).toBeInTheDocument()
    })
  })

  it('updates when .dark class is applied to an ancestor', async () => {
    document.documentElement.style.setProperty('--text-base', '0.8125rem')
    render(<TypeSpecimen sizeVar="--text-base" />)
    await waitFor(() => {
      expect(screen.getByText('0.8125rem')).toBeInTheDocument()
    })

    document.documentElement.style.setProperty('--text-base', '0.875rem')
    document.documentElement.classList.add('dark')

    await waitFor(() => {
      expect(screen.getByText('0.875rem')).toBeInTheDocument()
    })
  })

  it('renders line height and weight when provided', async () => {
    document.documentElement.style.setProperty('--text-base', '0.8125rem')
    document.documentElement.style.setProperty('--text-base--line-height', '1.5')
    render(
      <TypeSpecimen sizeVar="--text-base" lineHeightVar="--text-base--line-height" weight={600} />,
    )
    await waitFor(() => {
      expect(screen.getByText('0.8125rem / 1.5 · weight 600')).toBeInTheDocument()
    })
  })
})
