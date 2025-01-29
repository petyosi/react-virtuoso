import styled from '@emotion/styled'

import { GridComponents, VirtuosoGrid } from '../src'

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
      components={{
        Item: ItemContainer,
        List: ListContainer,
        ScrollSeekPlaceholder: ({ height, index, width }) => (
          <div aria-label="placeholder" style={{ color: 'red', height, width }}>
            Placeholder {index}
          </div>
        ),
      }}
      computeItemKey={(key) => `item-${key}`}
      itemContent={(index) => <div>Item {index}</div>}
      scrollSeekConfiguration={{
        enter: (velocity) => Math.abs(velocity) > 200,
        exit: (velocity) => Math.abs(velocity) < 30,
      }}
      style={{ height: 300, width: 600 }}
      totalCount={10000}
    />
  )
}
