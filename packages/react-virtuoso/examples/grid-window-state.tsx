import * as React from 'react'

import styled from '@emotion/styled'

import { VirtuosoGrid } from '../src'

import type { GridComponents, GridStateSnapshot } from '../src'

const ItemContainer = styled.div`
  box-sizing: border-box;
  padding: 5px;
  width: 25%;
  background: #f5f5f5;
  display: flex;
  flex: none;
  align-content: stretch;
`

const ItemWrapper = styled.div`
  flex: 1;
  text-align: center;
  height: 30px;
  padding: 20px;
  background: white;
`

const ListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
` as NonNullable<GridComponents['List']>

export function Example() {
  const state = React.useRef<GridStateSnapshot | null>(null)
  const [key, setKey] = React.useState(0)

  return (
    <div style={{ paddingTop: 100, width: 1200 }}>
      <button
        id="reload"
        onClick={() => {
          setKey((value) => value + 1)
        }}
      >
        Reload
      </button>
      <VirtuosoGrid
        components={{
          Item: ItemContainer,
          List: ListContainer,
        }}
        itemContent={(index) => <ItemWrapper>Item {index}</ItemWrapper>}
        key={key}
        restoreStateFrom={state.current}
        stateChanged={(snapshot) => {
          state.current = snapshot
        }}
        totalCount={1000}
        useWindowScroll
      />
    </div>
  )
}
