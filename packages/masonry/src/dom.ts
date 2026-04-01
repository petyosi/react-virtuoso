import type React from 'react'

import { Cell, combine, DerivedCell, map, pipe } from '@virtuoso.dev/gurx'

export const scrollTop$ = Cell(0)

export const viewportHeight$ = Cell(0)

export const viewportWidth$ = Cell(0)

export const scrollHeight$ = Cell(0)

export const listOffset$ = Cell(0)

export const useWindowScroll$ = Cell(false)

export const scrollElementRef$ = Cell<React.RefObject<HTMLElement | null> | undefined>(undefined)

export const hasExternalScroller$ = DerivedCell(false, () => {
  return pipe(
    combine(useWindowScroll$, scrollElementRef$),
    map(([useWindowScroll, scrollElementRef]) => {
      return useWindowScroll || (scrollElementRef?.current !== undefined && scrollElementRef?.current !== null)
    })
  )
})

export const visibleListHeight$ = DerivedCell(0, () => {
  return pipe(
    combine(viewportHeight$, hasExternalScroller$, listOffset$),
    map(([viewportHeight, hasExternalScroller, listOffset]) => {
      const result = hasExternalScroller ? viewportHeight - Math.max(listOffset, 0) : viewportHeight
      return result
    })
  )
})
