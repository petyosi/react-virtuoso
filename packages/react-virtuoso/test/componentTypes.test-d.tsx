import * as React from 'react'

import { Virtuoso, VirtuosoGrid } from '../src'

import type { Components, GridComponents } from '../src'

interface Row {
  id: number
}

/**
 * Issue #864: a custom `List` wrapper may render a `ul` instead of a `div`.
 * The host element is a type parameter on `Components`/`GridComponents`, so
 * an explicitly typed `ul` list stays fully typed, while an untyped inline
 * `forwardRef` list (the common case) still compiles without annotation.
 * Checked by `pnpm typecheck` (this file is not a runtime vitest case).
 */
const DivList: Components['List'] = React.forwardRef(function DivList({ style, children }, ref) {
  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  )
})

export const inlineForwardRefList = (
  <Virtuoso data={[{ id: 1 }]} components={{ List: React.forwardRef((props, ref) => <div {...props} ref={ref} />) }} />
)

export const explicitTypeArgsUsage = <Virtuoso<Row, unknown> data={[{ id: 1 }]} itemContent={(_, row) => row.id} />

const LiItem: Components<Row>['Item'] = ({ children, context: _context, item: _item, ...props }) => <li {...props}>{children}</li>

const UlList: Components<unknown, unknown, HTMLUListElement>['List'] = React.forwardRef(function UlList({ style, children }, ref) {
  return (
    <ul ref={ref} style={style}>
      {children}
    </ul>
  )
})

const GridUlList: GridComponents<unknown, HTMLUListElement>['List'] = React.forwardRef(function GridUlList(
  { style, children, ...props },
  ref
) {
  return (
    <ul ref={ref} style={style} {...props}>
      {children}
    </ul>
  )
})

type UlListRef = React.ComponentProps<NonNullable<Components<unknown, unknown, HTMLUListElement>['List']>>['ref']

// The forwarded ref stays narrowed to the chosen host element. If it widened back to `any`, a
// `div` ref would become assignable here and this would resolve to `never`.
export const ulListRefStaysChecked: React.Ref<HTMLDivElement> extends UlListRef ? never : true = true

export const typedUlListUsage = <Virtuoso data={[{ id: 1 }]} components={{ List: UlList }} />

export const typedGridUlListUsage = <VirtuosoGrid data={[{ id: 1 }]} components={{ List: GridUlList }} />

export { DivList, GridUlList, LiItem, UlList }
