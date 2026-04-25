import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { viewportAtom } from '@/store/atoms/viewport'
import { renderWithStore } from '@/test/renderWithStore'

import { StatusBar } from './StatusBar'

describe('StatusBar', () => {
  it('renders viewport state from the atom', () => {
    renderWithStore(<StatusBar />, (store) => {
      store.set(viewportAtom, { x: 5, y: 10, zoom: 2, docSize: { w: 48, h: 48 } })
    })

    expect(screen.getByTestId('coordinates')).toHaveTextContent('X: 5 Y: 10')
    expect(screen.getByTestId('zoom')).toHaveTextContent('200%')
    expect(screen.getByTestId('doc-size')).toHaveTextContent('48 × 48')
  })

  it('renders default viewport when atom is not seeded', () => {
    renderWithStore(<StatusBar />)

    expect(screen.getByTestId('coordinates')).toHaveTextContent('X: 0 Y: 0')
    expect(screen.getByTestId('zoom')).toHaveTextContent('100%')
    expect(screen.getByTestId('doc-size')).toHaveTextContent('24 × 24')
  })
})
