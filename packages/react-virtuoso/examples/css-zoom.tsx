import * as React from 'react'

import { Virtuoso, VirtuosoGrid } from '../src'

import type { GridComponents } from '../src'

function useLoadMore() {
  const [count, setCount] = React.useState(50)
  const loadMore = React.useCallback(() => {
    setCount((c) => c + 50)
  }, [])
  return { count, loadMore }
}

const itemContent = (index: number) => <div style={{ background: index % 2 ? '#eee' : '#ccc', height: 40 }}>Item {index}</div>

function CustomScrollParentList({ scrollParentZoom, wrapperZoom }: { scrollParentZoom?: number; wrapperZoom?: number }) {
  const [scrollParent, setScrollParent] = React.useState<HTMLElement | null>(null)
  const { count, loadMore } = useLoadMore()

  return (
    <div style={{ zoom: wrapperZoom }}>
      <div id="loaded-count">{count}</div>
      <div data-testid="scroll-parent" ref={setScrollParent} style={{ height: 400, overflow: 'auto', zoom: scrollParentZoom }}>
        {scrollParent ? (
          <Virtuoso customScrollParent={scrollParent} endReached={loadMore} itemContent={itemContent} totalCount={count} />
        ) : null}
      </div>
    </div>
  )
}

export const CustomScrollParent = () => <CustomScrollParentList wrapperZoom={0.75} />
export const CustomScrollParentZoomIn = () => <CustomScrollParentList wrapperZoom={1.5} />
export const CustomScrollParentZoomed = () => <CustomScrollParentList scrollParentZoom={0.75} />

export function WindowScroll() {
  const { count, loadMore } = useLoadMore()

  return (
    <div style={{ zoom: 0.75 }}>
      <div id="loaded-count">{count}</div>
      <Virtuoso endReached={loadMore} itemContent={itemContent} totalCount={count} useWindowScroll />
    </div>
  )
}

const gridComponents: GridComponents = {
  Item: ({ children, ...props }) => (
    <div {...props} style={{ width: '25%' }}>
      {children}
    </div>
  ),
  List: React.forwardRef(({ children, style, ...props }, ref) => (
    <div ref={ref} {...props} style={{ ...style, display: 'flex', flexWrap: 'wrap' }}>
      {children}
    </div>
  )),
}

export function GridCustomScrollParent() {
  const [scrollParent, setScrollParent] = React.useState<HTMLElement | null>(null)
  const { count, loadMore } = useLoadMore()

  return (
    <div style={{ zoom: 0.75 }}>
      <div id="loaded-count">{count}</div>
      <div data-testid="scroll-parent" ref={setScrollParent} style={{ height: 400, overflow: 'auto' }}>
        {scrollParent ? (
          <VirtuosoGrid
            components={gridComponents}
            customScrollParent={scrollParent}
            endReached={loadMore}
            itemContent={itemContent}
            totalCount={count * 4}
          />
        ) : null}
      </div>
    </div>
  )
}
