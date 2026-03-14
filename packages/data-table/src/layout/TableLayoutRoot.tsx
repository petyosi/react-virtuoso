import React, { useMemo } from 'react'
import type { CSSProperties } from 'react'

import { useCellValues } from '@virtuoso.dev/reactive-engine-react'

import { scrollBarScrollerWidth$, stickyHeaderHeight$ } from '../scroll/dom'
import { tableReady$ } from './table-ready'

type TableLayoutRootProps = Omit<React.HTMLProps<HTMLDivElement>, 'ref' | 'data' | 'onScroll'>

export function TableLayoutRoot({ children, style: passedStyle = {}, ...htmlProps }: TableLayoutRootProps) {
  const [scrollbarScrollerWidth, headerHeight, tableReady] = useCellValues(scrollBarScrollerWidth$, stickyHeaderHeight$, tableReady$)

  const rootStyle = useMemo(
    () =>
      ({
        position: 'relative',
        '--header-height': `${headerHeight}px`,
        '--scrollbar-width': `${scrollbarScrollerWidth}px`,
        // Shared width reserved for the overlay scrollbar (used by overlay + right-sticky columns).
        '--overlay-scrollbar-visible-size': 'max(var(--scrollbar-width), 15px)',
        ...passedStyle,
      }) as CSSProperties,
    [headerHeight, scrollbarScrollerWidth, passedStyle]
  )

  return (
    <div {...htmlProps} data-testid="virtuoso-table-root" data-ready={tableReady || undefined} style={rootStyle}>
      {children}
    </div>
  )
}
