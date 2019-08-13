import React, { useRef, useState, useEffect } from 'react'
import * as ReactDOM from 'react-dom'
import { GroupedVirtuoso, TItemContainer, TListContainer } from '../src/'
import { ListItem } from '../src/GroupIndexTransposer'

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

const ListContainer: TListContainer = ({ children, listRef, style }) => (
  <ul ref={listRef} style={style}>
    {children}
  </ul>
)

const App = () => {
  const [groupCounts, setGroupCounts] = useState<number[]>([10, 10, 10])
  const virtuoso = useRef(null)

  useEffect(() => {
    setTimeout(() => {
      const groups = []
      for (let index = 0; index < 10; index++) {
        groups.push(10)
      }
      setGroupCounts(groups)
    }, 500)
  }, [])

  return (
    <div style={{ display: 'block' }}>
      <div>
        <button onClick={() => virtuoso.current.scrollToIndex(77)}>Go to 77</button>
        <GroupedVirtuoso
          ref={virtuoso}
          style={{ height: '400px', width: '350px' }}
          overscan={0}
          groupCounts={groupCounts}
          itemsRendered={items => {
            console.log({ itemsRendered: items })
          }}
          ItemContainer={React.memo(ItemContainer)}
          ListContainer={React.memo(ListContainer)}
          GroupContainer={React.memo(GroupContainer)}
          endReached={index => {
            console.log('end reached', index)
          }}
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
    </div>
  )
}

function AppWrapper() {
  const [renderApp, setRenderApp] = useState(true)
  useEffect(() => {
    setTimeout(() => {
      setRenderApp(false)
    }, 5000)
  }, [])
  return renderApp ? <App /> : <div />
}

ReactDOM.render(<AppWrapper />, document.getElementById('root'))
