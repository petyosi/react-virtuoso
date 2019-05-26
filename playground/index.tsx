import React, { useRef } from 'react'
import * as ReactDOM from 'react-dom'
import { GroupedVirtuoso, TItemContainer, TListContainer } from '../src/'

const ItemContainer: TItemContainer = ({ children, ...props }) => {
  return <li {...props}>{children}</li>
}

const GroupContainer: TItemContainer = ({ children, ...props }) => {
  return (
    <li {...props}>
      <strong>{children}</strong>
    </li>
  )
}

const ListContainer: TListContainer = ({ children, listRef, className }) => (
  <ul className={className} ref={listRef}>
    {children}
  </ul>
)

const App = () => {
  const groupCounts = []
  for (let index = 0; index < 10; index++) {
    groupCounts.push(10)
  }

  const virtuoso = useRef(null)
  return (
    <div>
      <button onClick={() => virtuoso.current.scrollToIndex(77)}>Go to 77</button>
      <GroupedVirtuoso
        ref={virtuoso}
        style={{ height: '400px', width: '350px' }}
        groupCounts={groupCounts}
        ItemContainer={React.memo(ItemContainer)}
        ListContainer={React.memo(ListContainer)}
        GroupContainer={React.memo(GroupContainer)}
        group={index => {
          return (
            <div style={{ height: '20px' }}>
              Group {index * 10} &ndash; {index * 10 + 10}
            </div>
          )
        }}
        item={(index, groupIndex) => {
          return (
            <div style={{ height: '40px' }}>
              {index} (group {groupIndex})
            </div>
          )
        }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
