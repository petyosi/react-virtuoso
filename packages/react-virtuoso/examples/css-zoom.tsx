import * as React from 'react'

import { TableVirtuoso, Virtuoso, VirtuosoGrid } from '../src'

import type { GridComponents, StateSnapshot, VirtuosoHandle } from '../src'

function useLoadMore() {
  const [count, setCount] = React.useState(50)
  const loadMore = React.useCallback(() => {
    setCount((c) => c + 50)
  }, [])
  return { count, loadMore }
}

const itemContent = (index: number) => <div style={{ background: index % 2 ? '#eee' : '#ccc', height: 40 }}>Item {index}</div>

function CustomScrollParentList({
  listZoom,
  scrollParentZoom,
  wrapperZoom,
}: {
  listZoom?: number
  scrollParentZoom?: number
  wrapperZoom?: number
}) {
  const [scrollParent, setScrollParent] = React.useState<HTMLElement | null>(null)
  const { count, loadMore } = useLoadMore()

  return (
    <div style={{ zoom: wrapperZoom }}>
      <div id="loaded-count">{count}</div>
      <div data-testid="scroll-parent" ref={setScrollParent} style={{ height: 400, overflow: 'auto', zoom: scrollParentZoom }}>
        <div style={{ zoom: listZoom }}>
          {scrollParent ? (
            <Virtuoso customScrollParent={scrollParent} endReached={loadMore} itemContent={itemContent} totalCount={count} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export const CustomScrollParent = () => <CustomScrollParentList wrapperZoom={0.75} />
export const CustomScrollParentZoomIn = () => <CustomScrollParentList wrapperZoom={1.5} />
export const CustomScrollParentZoomed = () => <CustomScrollParentList scrollParentZoom={0.75} />
// 1.1 has no exact float32 representation, unlike 0.75 and 1.5
export const CustomScrollParentInexactZoom = () => <CustomScrollParentList wrapperZoom={1.1} />
export const CustomScrollParentListZoom = () => <CustomScrollParentList listZoom={0.8} />

export function DefaultScroller() {
  const { count, loadMore } = useLoadMore()

  return (
    <div style={{ zoom: 0.8 }}>
      <div id="loaded-count">{count}</div>
      <Virtuoso data-testid="scroll-parent" endReached={loadMore} itemContent={itemContent} style={{ height: 400 }} totalCount={count} />
    </div>
  )
}

export function TableCustomScrollParent() {
  const [scrollParent, setScrollParent] = React.useState<HTMLElement | null>(null)
  const { count, loadMore } = useLoadMore()

  return (
    <div style={{ zoom: 0.8 }}>
      <div id="loaded-count">{count}</div>
      <div data-testid="scroll-parent" ref={setScrollParent} style={{ height: 400, overflow: 'auto' }}>
        {scrollParent ? (
          <TableVirtuoso
            customScrollParent={scrollParent}
            endReached={loadMore}
            fixedHeaderContent={() => (
              <tr>
                <th style={{ background: 'white', height: 30 }}>Header</th>
              </tr>
            )}
            itemContent={(index) => <td style={{ height: 40 }}>Row {index}</td>}
            style={{ width: '100%' }}
            totalCount={count}
          />
        ) : null}
      </div>
    </div>
  )
}

function ImperativeList({ scrollParentMode, zoom }: { scrollParentMode: boolean; zoom: number }) {
  const ref = React.useRef<VirtuosoHandle>(null)
  const [scrollParent, setScrollParent] = React.useState<HTMLElement | null>(null)
  const [snapshot, setSnapshot] = React.useState<StateSnapshot>()
  const [generation, setGeneration] = React.useState(0)

  const listProps = { itemContent, totalCount: 1000, ...(snapshot ? { restoreStateFrom: snapshot } : {}) }

  return (
    <>
      {/* fixed, since scrolling the page to click a button would move the position under test */}
      <div style={{ position: 'fixed', right: 0, top: 0, zIndex: 1 }}>
        <button id="scroll-to-index" onClick={() => ref.current!.scrollToIndex({ align: 'start', index: 500 })}>
          Scroll to 500
        </button>
        <button id="scroll-by" onClick={() => ref.current!.scrollBy({ top: 4000 })}>
          Scroll by 4000
        </button>
        <button
          id="save-and-restore"
          onClick={() => {
            ref.current!.getState((state) => {
              setSnapshot(state)
              setGeneration((value) => value + 1)
            })
          }}
        >
          Save and restore
        </button>
        <span id="snapshot-scroll-top">{snapshot?.scrollTop}</span>
      </div>
      {scrollParentMode ? (
        <div data-testid="scroll-parent" ref={setScrollParent} style={{ height: 400, overflow: 'auto' }}>
          <div style={{ zoom }}>
            {scrollParent ? <Virtuoso customScrollParent={scrollParent} key={generation} ref={ref} {...listProps} /> : null}
          </div>
        </div>
      ) : (
        <div style={{ zoom }}>
          <div style={{ height: 100 }}>Content above the list</div>
          <Virtuoso key={generation} ref={ref} useWindowScroll {...listProps} />
        </div>
      )}
    </>
  )
}

export const ImperativeWindowScroll = () => <ImperativeList scrollParentMode={false} zoom={0.8} />
export const ImperativeWindowScrollZoomIn = () => <ImperativeList scrollParentMode={false} zoom={1.1} />
export const ImperativeCustomScrollParent = () => <ImperativeList scrollParentMode zoom={0.8} />

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

const fixedWidthGridComponents: GridComponents = {
  Item: ({ children, ...props }) => (
    <div {...props} style={{ flex: 'none', width: 100 }}>
      {children}
    </div>
  ),
  List: React.forwardRef(({ children, style, ...props }, ref) => (
    <div ref={ref} {...props} style={{ ...style, display: 'flex', flexWrap: 'wrap' }}>
      {children}
    </div>
  )),
}

const gridCell = (index: number) => <div style={{ background: index % 2 ? '#eee' : '#ccc', height: 30 }}>{index}</div>

// 496px fits 4 columns of 100px, while an item measured as 99.99999px and floored to 99px suggests 5.
const FixedWidthGrid = ({ zoom }: { zoom: number }) => (
  <div style={{ zoom }}>
    <VirtuosoGrid
      components={fixedWidthGridComponents}
      data-testid="scroll-parent"
      itemContent={gridCell}
      style={{ height: 300, width: 496 }}
      totalCount={100}
    />
  </div>
)

export const GridFixedWidth = () => <FixedWidthGrid zoom={0.8} />
export const GridFixedWidthZoomIn = () => <FixedWidthGrid zoom={1.1} />

export function GridFitsWithoutScrolling() {
  const [endReachedCount, setEndReachedCount] = React.useState(0)

  return (
    <div style={{ zoom: 0.8 }}>
      <div id="end-reached-count">{endReachedCount}</div>
      <VirtuosoGrid
        components={fixedWidthGridComponents}
        endReached={() => {
          setEndReachedCount((value) => value + 1)
        }}
        itemContent={gridCell}
        style={{ height: 500, width: 400 }}
        totalCount={24}
      />
    </div>
  )
}
