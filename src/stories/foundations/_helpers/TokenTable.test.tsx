import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TokenTable } from './TokenTable'

describe('TokenTable', () => {
  afterEach(() => {
    document.documentElement.style.cssText = ''
    document.documentElement.className = ''
  })

  it('renders a title and a grid of swatches', () => {
    document.documentElement.style.setProperty('--a', 'red')
    document.documentElement.style.setProperty('--b', 'blue')

    render(
      <TokenTable
        title="Surfaces"
        tokens={[
          { label: 'Color A', variable: '--a' },
          { label: 'Color B', variable: '--b' },
        ]}
      />,
    )

    expect(screen.getByText('Surfaces')).toBeInTheDocument()
    expect(screen.getAllByTestId('token-swatch')).toHaveLength(2)
  })

  it('renders without a title when omitted', () => {
    document.documentElement.style.setProperty('--c', 'green')

    render(<TokenTable tokens={[{ label: 'C', variable: '--c' }]} />)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('token-swatch')).toHaveLength(1)
  })

  it('renders an empty section when the tokens array is empty', () => {
    render(<TokenTable tokens={[]} />)

    expect(screen.queryByTestId('token-swatch')).not.toBeInTheDocument()
    expect(screen.getByTestId('token-table')).toBeInTheDocument()
  })

  it('passes labels through to each swatch', () => {
    document.documentElement.style.setProperty('--x', '#fff')
    document.documentElement.style.setProperty('--y', '#000')

    render(
      <TokenTable
        tokens={[
          { label: 'White', variable: '--x' },
          { label: 'Black', variable: '--y' },
        ]}
      />,
    )

    expect(screen.getByText('White')).toBeInTheDocument()
    expect(screen.getByText('Black')).toBeInTheDocument()
  })
})
