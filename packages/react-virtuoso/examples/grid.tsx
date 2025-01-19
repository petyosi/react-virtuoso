import * as React from 'react'
import { VirtuosoGrid, VirtuosoGridHandle, GridComponents, LogLevel } from '../src'
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

export function Example() {
  const ref = React.createRef<VirtuosoGridHandle>()

  return (
    <>
      <VirtuosoGrid
        ref={ref}
        logLevel={LogLevel.INFO}
        components={{
          Item: ItemContainer,
          List: ListContainer,
          ScrollSeekPlaceholder: () => (
            <ItemContainer>
              <ItemWrapper>Placeholder</ItemWrapper>
            </ItemContainer>
          ),
        }}
        totalCount={100}
        scrollSeekConfiguration={{
          enter: (velocity) => Math.abs(velocity) > 200,
          exit: (velocity) => Math.abs(velocity) < 30,
        }}
        itemContent={(index) => <ItemWrapper>Item {index}</ItemWrapper>}
        style={{ height: 300, width: 1200 }}
      />

      <button id="start-30" onClick={() => ref.current!.scrollToIndex({ index: 30, align: 'start' })}>
        Start 30
      </button>
      <button id="center-50" onClick={() => ref.current!.scrollToIndex({ index: 50, align: 'center', behavior: 'smooth' })}>
        Center 50
      </button>
      <button id="end-99" onClick={() => ref.current!.scrollToIndex({ index: 99, align: 'end' })}>
        End 99
      </button>
    </>
  )
}

export function ReadyStateChanged() {
  const ref = React.createRef<VirtuosoGridHandle>()
  const [gridVisible, setGridVisible] = React.useState(false)

  return (
    <>
      <VirtuosoGrid
        ref={ref}
        readyStateChanged={(value) => {
          setGridVisible(value)
        }}
        components={{
          Item: ItemContainer,
          List: ListContainer,
        }}
        totalCount={100}
        itemContent={(index) => <ItemWrapper>Item {index}</ItemWrapper>}
        style={{ height: 300, width: 1200, visibility: gridVisible ? 'visible' : 'hidden' }}
      />
    </>
  )
}
