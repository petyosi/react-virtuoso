import * as React from 'react'
import { GridComponents, VirtuosoGrid } from '../src'
import styled from '@emotion/styled'

const ItemContainer = styled.div`
  box-sizing: border-box;
  padding: 5px;
  width: 50%;
  background: #f5f5f5;
  display: flex;
  flex: none;
  align-content: stretch;
  height: 30px;
`

const ListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
` as GridComponents['List']

export function Example() {
  return (
    <VirtuosoGrid
      computeItemKey={(key) => `item-${key}`}
      totalCount={10000}
      itemContent={(index) => <div>Item {index}</div>}
      style={{ height: 300, width: 600 }}
      scrollSeekConfiguration={{
        enter: (velocity) => Math.abs(velocity) > 200,
        exit: (velocity) => Math.abs(velocity) < 30,
      }}
      components={{
        Item: ItemContainer,
        List: ListContainer,
        ScrollSeekPlaceholder: ({ index, width, height }) => (
          <div aria-label="placeholder" style={{ height, width, color: 'red' }}>
            Placeholder {index}
          </div>
        ),
      }}
    />
  )
}
