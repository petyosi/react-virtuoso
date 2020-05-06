import { default as React, useRef, useState } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const User = React.memo(({ user }) => {
  console.log(`rendering user ${user.index}`)
  return <span>User {user.index}</span>
})

const App = () => {
  const virtuoso = useRef(null)
  const initialIndexOffset = useRef(10000)
  const [users, setUsers] = useState(
    Array(200)
      .fill(true)
      .map((_, index) => ({
        index: 10000 + index,
      }))
  )

  const prependItems = React.useCallback(() => {
    const usersToPrepend = 100
    initialIndexOffset.current -= usersToPrepend
    setUsers([
      ...Array(usersToPrepend)
        .fill(true)
        .map((_, index) => ({ index: initialIndexOffset.current + index })),
      ...users,
    ])
    virtuoso.current.adjustForPrependedItems(usersToPrepend)
    return false
  }, [initialIndexOffset, users, setUsers])

  return (
    <div style={{ display: 'flex' }}>
      <div>
        <Virtuoso
          ref={virtuoso}
          totalCount={users.length}
          item={index => <User user={users[index]} />}
          style={{ height: '400px', width: '350px' }}
        />
      </div>
      <div>
        <ul className="knobs">
          <li>
            <button onClick={prependItems}>Prepend 100 items</button>
          </li>
        </ul>
      </div>
    </div>
  )
}
ReactDOM.render(<App />, document.getElementById('root'))
