import { useEffect, useState } from 'react'

function resolveVar(element: HTMLElement, variable: string): string {
  let node: HTMLElement | null = element
  while (node) {
    const v = getComputedStyle(node).getPropertyValue(variable).trim()
    if (v) return v
    node = node.parentElement
  }
  return ''
}

export function useCssVar(variable: string, element: HTMLElement | null): string {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (!element || !variable) return

    const read = () => {
      setValue(resolveVar(element, variable))
    }

    read()

    const observer = new MutationObserver(read)
    let node: Element | null = element
    while (node) {
      observer.observe(node, { attributes: true, attributeFilter: ['class'] })
      node = node.parentElement
    }

    return () => {
      observer.disconnect()
    }
  }, [variable, element])

  return value
}
