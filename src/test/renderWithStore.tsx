import { render, type RenderResult } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import type { ReactElement } from 'react'

export type TestStore = ReturnType<typeof createStore>

export interface RenderWithStoreResult extends RenderResult {
  store: TestStore
}

export function renderWithStore(
  ui: ReactElement,
  seed?: (store: TestStore) => void,
): RenderWithStoreResult {
  const store = createStore()
  seed?.(store)
  const utils = render(<Provider store={store}>{ui}</Provider>)
  return { ...utils, store }
}
