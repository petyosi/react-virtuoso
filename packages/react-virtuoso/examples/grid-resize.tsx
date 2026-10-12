import React from 'react'

import styled from '@emotion/styled'

import { VirtuosoGrid } from '../src'

import type { GridComponents } from '../src'

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

export function Example() {
  return <VirtuosoGrid components={components} itemContent={itemContent} overscan={1600} totalCount={1000} useWindowScroll />
}

export function ElementScroll() {
  return <VirtuosoGrid components={components} itemContent={itemContent} overscan={1600} style={{ height: 600 }} totalCount={1000} />
}

export function CustomScrollParent() {
  const [parent, setParent] = React.useState<HTMLDivElement | null>(null)
  return (
    <div ref={setParent} style={{ height: 600, overflow: 'auto' }}>
      {parent && (
        <VirtuosoGrid components={components} customScrollParent={parent} itemContent={itemContent} overscan={1600} totalCount={1000} />
      )}
    </div>
  )
}
