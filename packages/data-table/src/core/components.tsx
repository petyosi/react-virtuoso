import React from 'react'

import { Cell } from '@virtuoso.dev/reactive-engine-core'

import type {
  ContextAwareComponent,
  FooterWrapperComponent,
  HeaderWrapperComponent,
  ScrollElementComponent,
  StickyFooterWrapperComponent,
  StickyHeaderWrapperComponent,
} from '../interfaces'

export const header$ = Cell<ContextAwareComponent | null>(null)
export const stickyHeader$ = Cell<ContextAwareComponent | null>(null)
export const footer$ = Cell<ContextAwareComponent | null>(null)
export const stickyFooter$ = Cell<ContextAwareComponent | null>(null)
export const emptyPlaceholder$ = Cell<ContextAwareComponent | null>(null)
export const scrollElement$ = Cell<ScrollElementComponent | 'div'>('div')

const STICKY_TOP_STYLE = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
} as React.CSSProperties

export const NO_OVERFLOW_ANCHOR_STYLE = {
  overflowAnchor: 'none',
} as React.CSSProperties

const STICKY_BOTTOM_STYLE = {
  position: 'sticky',
  bottom: 0,
} as React.CSSProperties

const DEFAULT_HEADER_STYLE = { zIndex: 1 } as React.CSSProperties

export const DefaultHeaderWrapper: HeaderWrapperComponent = React.forwardRef<HTMLDivElement>(function DefaultHeaderWrapper(props, ref) {
  return <div style={DEFAULT_HEADER_STYLE} {...props} ref={ref} />
})

export const DefaultFooterWrapper: FooterWrapperComponent = React.forwardRef<HTMLDivElement>(function DefaultFooterWrapper(props, ref) {
  return <div {...props} ref={ref} />
})

export const DefaultStickyHeaderWrapper: StickyHeaderWrapperComponent = React.forwardRef<HTMLDivElement, { style: React.CSSProperties }>(
  function DefaultStickyHeaderWrapper({ style, ...props }, ref) {
    const mergedStyle = React.useMemo(() => ({ ...STICKY_TOP_STYLE, ...style }), [style])
    return <div {...props} style={mergedStyle} ref={ref} />
  }
)

export const DefaultStickyFooterWrapper: StickyFooterWrapperComponent = React.forwardRef<HTMLDivElement, { style: React.CSSProperties }>(
  function DefaultStickyFooterWrapper({ style, ...props }, ref) {
    const mergedStyle = React.useMemo(() => ({ ...STICKY_BOTTOM_STYLE, ...style }), [style])
    return <div {...props} style={mergedStyle} ref={ref} />
  }
)

export const headerWrapper$ = Cell<HeaderWrapperComponent>(DefaultHeaderWrapper)
export const stickyHeaderWrapper$ = Cell<StickyHeaderWrapperComponent>(DefaultStickyHeaderWrapper)
export const footerWrapper$ = Cell<FooterWrapperComponent>(DefaultFooterWrapper)
export const stickyFooterWrapper$ = Cell<StickyFooterWrapperComponent>(DefaultStickyFooterWrapper)
