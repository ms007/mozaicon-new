import type { Meta, StoryObj } from '@storybook/react-vite'

import { Icon } from '../../icons/Icon'
import { ToggleGroup, ToggleGroupItem } from './ToggleGroup'

function AlignLeftIcon() {
  return (
    <Icon aria-hidden>
      <path d="M2 2v10m2-8h6m-6 3h8m-8 3h5" />
    </Icon>
  )
}

function AlignCenterIcon() {
  return (
    <Icon aria-hidden>
      <path d="M7 2v10M4 4h6M3 7h8M4 10h6" />
    </Icon>
  )
}

function AlignRightIcon() {
  return (
    <Icon aria-hidden>
      <path d="M12 2v10m-2-8H4m8 3H2m8 3H5" />
    </Icon>
  )
}

function Grid2x2Icon() {
  return (
    <Icon aria-hidden>
      <rect x="2" y="2" width="4" height="4" rx="0.5" />
      <rect x="8" y="2" width="4" height="4" rx="0.5" />
      <rect x="2" y="8" width="4" height="4" rx="0.5" />
      <rect x="8" y="8" width="4" height="4" rx="0.5" />
    </Icon>
  )
}

function Grid3x3Icon() {
  return (
    <Icon aria-hidden>
      <path d="M2 5h10M2 9h10M5 2v10M9 2v10" />
    </Icon>
  )
}

function LayoutGridIcon() {
  return (
    <Icon aria-hidden>
      <rect x="2" y="2" width="4" height="4" rx="0.5" />
      <rect x="8" y="2" width="4" height="4" rx="0.5" />
      <rect x="2" y="8" width="10" height="4" rx="0.5" />
    </Icon>
  )
}

const meta = {
  title: 'Primitives/ToggleGroup',
  component: ToggleGroup,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'single',
    defaultValue: 'center',
    children: (
      <>
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenterIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRightIcon />
        </ToggleGroupItem>
      </>
    ),
  },
}

export const Outline: Story = {
  args: {
    type: 'single',
    variant: 'outline',
    defaultValue: 'center',
    children: (
      <>
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenterIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRightIcon />
        </ToggleGroupItem>
      </>
    ),
  },
}

export const Multiple: Story = {
  args: {
    type: 'multiple',
    defaultValue: ['small', 'medium'],
    children: (
      <>
        <ToggleGroupItem value="small" aria-label="Small grid">
          <Grid2x2Icon />
        </ToggleGroupItem>
        <ToggleGroupItem value="medium" aria-label="Medium grid">
          <Grid3x3Icon />
        </ToggleGroupItem>
        <ToggleGroupItem value="large" aria-label="Large grid">
          <LayoutGridIcon />
        </ToggleGroupItem>
      </>
    ),
  },
}

export const Small: Story = {
  args: {
    type: 'single',
    size: 'sm',
    defaultValue: 'left',
    children: (
      <>
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenterIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRightIcon />
        </ToggleGroupItem>
      </>
    ),
  },
}

export const WithLabels: Story = {
  args: {
    type: 'single',
    variant: 'outline',
    defaultValue: 'center',
    children: (
      <>
        <ToggleGroupItem value="left">
          <AlignLeftIcon /> Left
        </ToggleGroupItem>
        <ToggleGroupItem value="center">
          <AlignCenterIcon /> Center
        </ToggleGroupItem>
        <ToggleGroupItem value="right">
          <AlignRightIcon /> Right
        </ToggleGroupItem>
      </>
    ),
  },
}

export const Disabled: Story = {
  args: {
    type: 'single',
    disabled: true,
    defaultValue: 'center',
    children: (
      <>
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenterIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRightIcon />
        </ToggleGroupItem>
      </>
    ),
  },
}
