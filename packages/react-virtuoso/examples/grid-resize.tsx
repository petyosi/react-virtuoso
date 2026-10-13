import React from 'react'

import styled from '@emotion/styled'

import { VirtuosoGrid } from '../src'

import type { GridComponents, VirtuosoGridProps } from '../src'

const List = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  column-gap: 15px;
  row-gap: 45px;
` as NonNullable<GridComponents['List']>

const Item = styled.div`
  aspect-ratio: 1;
  background: #eee;
`

const components = { Item, List }
const itemContent = (index: number) => <input aria-label={`Item ${index}`} defaultValue={`Item ${index}`} />

function ResizeGrid(props: VirtuosoGridProps<unknown>) {
  const [skipAnimationFrame, setSkipAnimationFrame] = React.useState(false)
  return (
    <>
      <label>
        <input type="checkbox" checked={skipAnimationFrame} onChange={(event) => setSkipAnimationFrame(event.target.checked)} />
        Measure before paint (may report ResizeObserver loop errors)
      </label>
      <VirtuosoGrid
        {...props}
        components={components}
        itemContent={itemContent}
        overscan={1600}
        totalCount={1000}
        skipAnimationFrameInResizeObserver={skipAnimationFrame}
      />
    </>
  )
}

export function Example() {
  return <ResizeGrid useWindowScroll />
}

export function ElementScroll() {
  return <ResizeGrid style={{ height: 600 }} />
}

export function CustomScrollParent() {
  const [parent, setParent] = React.useState<HTMLDivElement | null>(null)
  return (
    <div ref={setParent} style={{ height: 600, overflow: 'auto' }}>
      {parent && <ResizeGrid customScrollParent={parent} />}
    </div>
  )
}
