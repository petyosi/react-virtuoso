import { Cell, DerivedCell, combine, map, pipe } from '@virtuoso.dev/gurx'

export const scrollTop$ = Cell(0)

export const viewportHeight$ = Cell(0)

export const viewportWidth$ = Cell(0)

export const scrollHeight$ = Cell(0)

export const listScrollTop$ = scrollTop$

export const listOffset$ = Cell(0)

export const useWindowScroll$ = Cell(false)

export const visibleListHeight$ = DerivedCell(0, () => {
  return pipe(
    combine(viewportHeight$, useWindowScroll$, listOffset$),
    map(([viewportHeight, useWindowScroll, listOffset]) => {
      const result = useWindowScroll ? viewportHeight - Math.max(listOffset, 0) : viewportHeight
      return result
    })
  )
})
