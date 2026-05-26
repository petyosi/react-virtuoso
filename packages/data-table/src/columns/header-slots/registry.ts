// oxlint-disable require-hook
import type * as React from 'react'

import { createRegistryCell } from '../registry'

import type { ColumnInfo } from '../Column'
import type { ColumnState } from '../column-state'

export interface HeaderSlotRenderParams {
  columnKey: string
  column: ColumnInfo
  columnState: ColumnState
  overlaidByScrollbar: boolean
  headerRef: React.RefObject<HTMLDivElement | null>
}

export type HeaderSlotRenderFunction = (params: HeaderSlotRenderParams) => React.ReactNode

export type HeaderSlotCustomComponent<P = Record<string, unknown>> = React.ComponentType<HeaderSlotRenderParams & P>

export interface HeaderSlotEntry {
  columnId: string
  type: 'function' | 'component'
  renderer: HeaderSlotRenderFunction | HeaderSlotCustomComponent
  extraProps?: Record<string, unknown>
}

const headerSlotStartRegistry = createRegistryCell<HeaderSlotEntry>()
const headerSlotEndRegistry = createRegistryCell<HeaderSlotEntry>()
const headerSlotEdgeRegistry = createRegistryCell<HeaderSlotEntry>()
const headerSlotOverlayRegistry = createRegistryCell<HeaderSlotEntry>()

export const headerSlotStartEntries$ = headerSlotStartRegistry.cell$
export const headerSlotStartRegister$ = headerSlotStartRegistry.register$
export const headerSlotEndEntries$ = headerSlotEndRegistry.cell$
export const headerSlotEndRegister$ = headerSlotEndRegistry.register$
export const headerSlotEdgeEntries$ = headerSlotEdgeRegistry.cell$
export const headerSlotEdgeRegister$ = headerSlotEdgeRegistry.register$
export const headerSlotOverlayEntries$ = headerSlotOverlayRegistry.cell$
export const headerSlotOverlayRegister$ = headerSlotOverlayRegistry.register$
