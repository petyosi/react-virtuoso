import * as React from 'react'

import type { Components, GridComponents } from '../src'

/**
 * Issue #864: custom List/Item wrappers may be any HTML element, not only div.
 * The host element is a type parameter on `Components`/`GridComponents`, so the
 * forwarded `ref` stays fully typed for whichever element the wrapper renders.
 * Checked by `pnpm typecheck` (this file is not a runtime vitest case).
 */
const DivList: Components['List'] = React.forwardRef(function DivList({ style, children }, ref) {
  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  )
})

const UlList: Components<unknown, unknown, HTMLUListElement>['List'] = React.forwardRef(function UlList({ style, children }, ref) {
  return (
    <ul ref={ref} style={style}>
      {children}
    </ul>
  )
})

const SpanList: Components<unknown, unknown, HTMLSpanElement>['List'] = React.forwardRef(function SpanList({ style, children }, ref) {
  return (
    <span ref={ref} style={style}>
      {children}
    </span>
  )
})

const LiItem: Components<unknown, unknown, HTMLDivElement, HTMLLIElement>['Item'] = function LiItem({ children, ...props }) {
  return <li {...props}>{children}</li>
}

const ForwardedLiItem: Components<unknown, unknown, HTMLDivElement, HTMLLIElement>['Item'] = React.forwardRef(function ForwardedLiItem(
  { children, ...props },
  ref
) {
  return (
    <li ref={ref} {...props}>
      {children}
    </li>
  )
})

const GridUlList: GridComponents<any, HTMLUListElement>['List'] = React.forwardRef(function GridUlList({ style, children, ...props }, ref) {
  return (
    <ul ref={ref} style={style} {...props}>
      {children}
    </ul>
  )
})

const GridLiItem: GridComponents<any, HTMLDivElement, HTMLLIElement>['Item'] = React.forwardRef(function GridLiItem(
  { children, ...props },
  ref
) {
  return (
    <li ref={ref} {...props}>
      {children}
    </li>
  )
})

export { DivList, ForwardedLiItem, GridLiItem, GridUlList, LiItem, SpanList, UlList }
