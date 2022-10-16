import * as React from 'react'
import { GridComponents, VirtuosoGrid } from '../src'
import styled from '@emotion/styled'

const ItemContainer = styled.div`
  box-sizing: border-box;
  padding: 5px;
  width: 25%;
  background: #f5f5f5;
  display: flex;
  flex: none;
  align-content: stretch;
  /*
  @media (max-width: 1024px) {
    width: 33%;
  }

  @media (max-width: 768px) {
    width: 50%;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
  */
`

const ItemWrapper = styled.div`
    flex: 1;
    text-align: center;
    height: 30px;
    padding: 20px;
    background: white;
  }
`

const ListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
` as GridComponents['List']

export default function App() {
  return (
    <VirtuosoGrid
      totalCount={100}
      components={{
        Header: () => <div style={{ height: 150 }}>Header</div>,
        Footer: () => <div style={{ height: 60 }}>Footer</div>,
        Item: ItemContainer,
        List: ListContainer,
        ScrollSeekPlaceholder: () => (
          <ItemContainer>
            <ItemWrapper>Placeholder</ItemWrapper>
          </ItemContainer>
        ),
      }}
      itemContent={(index) => <ItemWrapper>Item {index}</ItemWrapper>}
      style={{ height: 600 }}
      overscan={150}
    />
  )
}
