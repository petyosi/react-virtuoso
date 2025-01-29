import styled from '@emotion/styled'

import { GridComponents, VirtuosoGrid } from '../src'

const ItemContainer = styled.div`
  width: 100px;
  height: 100px;
  display: flex;
`

const ItemWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80%;
  border: 1px solid #000;
  white-space: nowrap;
`

const ListContainer = styled.div`
  display: grid;
  grid-gap: 10px;
  grid-template-columns: repeat(auto-fill, 100px);
  grid-template-rows: repeat(auto-fill, 100px);
  justify-content: space-evenly;
  margin: 10px;
` as GridComponents['List']

export function Example() {
  return (
    <VirtuosoGrid
      components={{
        Item: ItemContainer,
        List: ListContainer,
        ScrollSeekPlaceholder: () => (
          <ItemContainer>
            <ItemWrapper>{'--'}</ItemWrapper>
          </ItemContainer>
        ),
      }}
      itemContent={(index) => <ItemWrapper>Item {index}</ItemWrapper>}
      overscan={200}
      scrollSeekConfiguration={{
        enter: (velocity) => Math.abs(velocity) > 200,
        exit: (velocity) => Math.abs(velocity) < 30,
      }}
      style={{ height: 340 }}
      totalCount={10000}
    />
  )
}
