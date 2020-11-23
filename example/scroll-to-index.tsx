import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { List, ListHandle } from '../src/List'
import faker from 'faker'
import { useRef } from 'react'

const contents = Array.from({ length: 20000 }).map((_, index) => (
  // `Item ${index}`
  // index % 2 ? ( <div style={{ height: 28, background: 'red' }}>Item {index}</div>) : ( <div style={{ height: 78, background: 'blue' }}>Item {index}</div>)
  <div
    style={{
      background: index % 2 ? 'red' : 'blue',
      borderBottom: '1px solid black',
    }}
  >
    Item {index}:
    <span
      style={{
        visibility: 'hidden',
        // height: '30px',
        // overflow: 'hidden',
        display: 'block',
      }}
    >
      {faker.lorem.paragraphs(1)}
    </span>
  </div>
))

const App = () => {
  const listRef = useRef<ListHandle>()
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <List
        ref={listRef}
        totalCount={20000}
        initialTopMostItemIndex={600}
        itemContent={index => (
          <div style={{ boxSizing: 'border-box' }}>{contents[index]}</div>
        )}
        style={{ height: '500px', width: '300px' }}
        id="my-id"
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => listRef.current!.scrollToIndex(500)}>
          Scroll to 500
        </button>
        <hr />
        <button
          onClick={() =>
            listRef.current!.scrollToIndex({ index: 200, align: 'center' })
          }
        >
          Scroll to 200 (center)
        </button>
        <hr />
        <button
          onClick={() =>
            listRef.current!.scrollToIndex({ index: 800, align: 'end' })
          }
        >
          Scroll to 800 (end)
        </button>
        <hr />
        <button
          onClick={() =>
            listRef.current!.scrollToIndex({
              index: 800,
              align: 'end',
              behavior: 'smooth',
            })
          }
        >
          Scroll to 800 (end, smooth)
        </button>
        <hr />
        <button
          onClick={() =>
            listRef.current!.scrollBy({
              top: -200,
              behavior: 'smooth',
            })
          }
        >
          Scroll By -200
        </button>
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
