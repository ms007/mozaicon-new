import type { ComponentType } from 'react'

import { Draw } from './Draw'
import { Ellipse } from './Ellipse'
import { Erase } from './Erase'
import { Fill } from './Fill'
import type { IconProps } from './Icon'
import { Line } from './Line'
import { Moon } from './Moon'
import { Rect } from './Rect'
import { Redo } from './Redo'
import { Sun } from './Sun'
import { Undo } from './Undo'

export type { IconProps } from './Icon'
export { Icon } from './Icon'
export { Draw, Ellipse, Erase, Fill, Line, Moon, Rect, Redo, Sun, Undo }

export type IconEntry = {
  id: string
  name: string
  Component: ComponentType<Omit<IconProps, 'children'>>
}

export const toolIcons: IconEntry[] = [
  { id: 'draw', name: 'Draw', Component: Draw },
  { id: 'erase', name: 'Erase', Component: Erase },
  { id: 'line', name: 'Line', Component: Line },
  { id: 'rect', name: 'Rect', Component: Rect },
  { id: 'ellipse', name: 'Ellipse', Component: Ellipse },
  { id: 'fill', name: 'Fill', Component: Fill },
]

export const headerIcons: IconEntry[] = [
  { id: 'undo', name: 'Undo', Component: Undo },
  { id: 'redo', name: 'Redo', Component: Redo },
  { id: 'sun', name: 'Sun', Component: Sun },
  { id: 'moon', name: 'Moon', Component: Moon },
]
