import * as React from 'react'
import { Virtuoso } from '../src'

const itemContent = (index: number) => <div style={{ height: index % 2 ? 30 : 20, background: 'white' }}>Item {index}</div>

export function App() {
  const data = Array(50)
    .fill(undefined)
    .map((_, i) => i)

  return (
    <div className="App">
      <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
        {Array(20)
          .fill(undefined)
          .map((_, i) => (
            <Virtuoso
              key={i}
              style={{
                flex: 1,
                height: 400,
                border: '2px black solid',
              }}
              data={data}
              itemContent={(_, i) => <div style={{ backgroundColor: i == 0 ? 'red' : 'transparent' }}>{i}</div>}
              //initialScrollTop={200}
              initialTopMostItemIndex={5}
            />
          ))}
      </div>
    </div>
  )
}

export function Example() {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', height: 400 }}>
        {Array.from({ length: 30 }).map((_, key) => {
          return (
            <Virtuoso
              key={key}
              totalCount={100}
              itemContent={itemContent}
              initialTopMostItemIndex={20}
              style={{ height: 300, minWidth: '3rem', fontSize: '7px', flex: 1 }}
            />
          )
        })}
      </div>
    </>
  )
}
