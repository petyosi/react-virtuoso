import React from 'react'

import { Cell } from '@virtuoso.dev/reactive-engine-core'

import type {
  ContextAwareComponent,
  FooterWrapperComponent,
  HeaderWrapperComponent,
  LoadingComponentProps,
  RowComponentProps,
  ScrollElementComponent,
  StickyColumnContainerComponentProps,
  StickyFooterWrapperComponent,
  StickyHeaderWrapperComponent,
} from '../interfaces'

export const header$ = Cell<ContextAwareComponent | null>(null)
export const stickyHeader$ = Cell<ContextAwareComponent | null>(null)
export const footer$ = Cell<ContextAwareComponent | null>(null)
export const stickyFooter$ = Cell<ContextAwareComponent | null>(null)
export const emptyPlaceholder$ = Cell<ContextAwareComponent | null>(null)
export const loadingPlaceholder$ = Cell<React.ComponentType<LoadingComponentProps> | null>(null)
export const loadingOverlay$ = Cell<React.ComponentType<LoadingComponentProps> | null>(null)
export const loadingFooter$ = Cell<React.ComponentType<LoadingComponentProps> | null>(null)
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

export const DefaultStickyHeaderWrapper: StickyHeaderWrapperComponent = React.forwardRef<
  HTMLDivElement,
  { style: React.CSSProperties; context?: unknown }
>(function DefaultStickyHeaderWrapper({ style, context: _context, ...props }, ref) {
  const mergedStyle = React.useMemo(() => ({ ...STICKY_TOP_STYLE, ...style }), [style])
  return <div {...props} style={mergedStyle} ref={ref} />
})

export const DefaultStickyFooterWrapper: StickyFooterWrapperComponent = React.forwardRef<HTMLDivElement, { style: React.CSSProperties }>(
  function DefaultStickyFooterWrapper({ style, ...props }, ref) {
    const mergedStyle = React.useMemo(() => ({ ...STICKY_BOTTOM_STYLE, ...style }), [style])
    return <div {...props} style={mergedStyle} ref={ref} />
  }
)

export type RowComponent = React.ComponentType<RowComponentProps & { context?: unknown }>
export const DefaultRowComponent: RowComponent = React.forwardRef<HTMLDivElement, RowComponentProps & { context?: unknown }>(
  function DefaultRowComponent({ context: _context, ...props }, ref) {
    return <div {...props} ref={ref} />
  }
)

export type StickyColumnContainerComponent = React.ComponentType<StickyColumnContainerComponentProps & { context?: unknown }>
export const DefaultStickyColumnContainer: StickyColumnContainerComponent = React.forwardRef<
  HTMLDivElement,
  StickyColumnContainerComponentProps & { context?: unknown }
>(function DefaultStickyColumnContainer({ context: _context, ...props }, ref) {
  return <div {...props} ref={ref} />
})

export const headerWrapper$ = Cell<HeaderWrapperComponent>(DefaultHeaderWrapper)
export const stickyHeaderWrapper$ = Cell<StickyHeaderWrapperComponent>(DefaultStickyHeaderWrapper)
export const footerWrapper$ = Cell<FooterWrapperComponent>(DefaultFooterWrapper)
export const stickyFooterWrapper$ = Cell<StickyFooterWrapperComponent>(DefaultStickyFooterWrapper)
export const rowComponent$ = Cell<RowComponent>(DefaultRowComponent)
export const stickyColumnContainer$ = Cell<StickyColumnContainerComponent>(DefaultStickyColumnContainer)
