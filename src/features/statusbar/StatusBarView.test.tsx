import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBarView } from './StatusBarView'

describe('StatusBarView', () => {
  it('renders coordinates from props', () => {
    render(<StatusBarView x={12} y={8} zoom={1} docWidth={24} docHeight={24} />)

    expect(screen.getByTestId('coordinates')).toHaveTextContent('X: 12 Y: 8')
  })

  it('renders zoom as a percentage', () => {
    render(<StatusBarView x={0} y={0} zoom={1.5} docWidth={24} docHeight={24} />)

    expect(screen.getByTestId('zoom')).toHaveTextContent('150%')
  })

  it('renders document size', () => {
    render(<StatusBarView x={0} y={0} zoom={1} docWidth={48} docHeight={32} />)

    expect(screen.getByTestId('doc-size')).toHaveTextContent('48 × 32')
  })

  it('rounds zoom percentage to nearest integer', () => {
    render(<StatusBarView x={0} y={0} zoom={0.333} docWidth={24} docHeight={24} />)

    expect(screen.getByTestId('zoom')).toHaveTextContent('33%')
  })

  it('rounds coordinates to integers', () => {
    render(<StatusBarView x={3.7} y={9.2} zoom={1} docWidth={24} docHeight={24} />)

    expect(screen.getByTestId('coordinates')).toHaveTextContent('X: 4 Y: 9')
  })

  it('has an accessible status role', () => {
    render(<StatusBarView x={0} y={0} zoom={1} docWidth={24} docHeight={24} />)

    expect(screen.getByRole('status', { name: 'Status bar' })).toBeInTheDocument()
  })
})
