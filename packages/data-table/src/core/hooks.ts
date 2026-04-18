import React from 'react'

import { useCellValue, useEngine } from '@virtuoso.dev/reactive-engine-react'

import { currentlyRenderedRows$ } from '../rows/row-state'
import { scrollLocation$ } from '../scroll/dom'
import { loadingState$ } from './loading'
import { virtuosoApiObject } from './virtuosoApiObject'

/**
 * Lets you access the current scroll location of the data table component from its child components. See {@link ListScrollLocation} for the available properties.
 *
 * @group Hooks
 */
export function useVirtuosoLocation() {
  return useCellValue(scrollLocation$)
}

/**
 * Lets you access the currently rendered data items.
 * @typeParam Data - The type of the data items in the table.
 *
 * @group Hooks
 */
export function useCurrentlyRenderedData<Data>(): Data[] {
  return useCellValue(currentlyRenderedRows$) as Data[]
}

/**
 * Lets you access the current semantic loading state of the data table from its child components.
 *
 * @group Hooks
 */
export function useVirtuosoLoadingState() {
  return useCellValue(loadingState$)
}

/**
 * Lets you access the data table methods from its child components. See {@link VirtuosoDataTableMethods} for the available methods.
 * @typeParam Data - The type of the data items in the table.
 *
 * @group Hooks
 */
export function useVirtuosoMethods<Data = unknown>() {
  const realm = useEngine()
  return React.useMemo(() => virtuosoApiObject<Data>(realm), [realm])
}
