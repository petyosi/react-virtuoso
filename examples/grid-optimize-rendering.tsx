import * as React from 'react'
import { VirtuosoGrid, GridComponents, VirtuosoGridHandle } from '../src'
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
    font-size: 80%;
    padding: 20px;
    box-shadow: 0 5px 6px -6px #777;
    background: white;
  }
`

const ListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
` as GridComponents['List']

const Item = React.memo<any>(({ item }: { item: { index: number; selected: boolean } }) => {
  return <div style={{ backgroundColor: item.selected ? 'blue' : 'white' }}>Item {item.index}</div>
})

export function Example() {
  const ref = React.createRef<VirtuosoGridHandle>()
  const [items, setItems] = React.useState(() => {
    return Array.from({ length: 1000 }, (_, index) => {
      return { index, selected: false }
    })
  })

  const itemContent = React.useCallback(
    (index: number) => (
      <ItemWrapper
        onClick={() => {
          setItems((items) => {
            return items.map((item, i) => {
              return i === index ? { index: i, selected: !item.selected } : item
            })
          })
        }}
      >
        <Item item={items[index]} />
      </ItemWrapper>
    ),
    [items, setItems]
  )

  return (
    <>
      <VirtuosoGrid
        ref={ref}
        components={{
          Item: ItemContainer,
          List: ListContainer,
        }}
        totalCount={items.length}
        itemContent={itemContent}
        style={{ height: 300, width: 1200 }}
      />
    </>
  )
}
