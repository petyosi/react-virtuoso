import * as React from 'react'

import { Virtuoso } from '../src'

const rows = (start: number) => Array.from({ length: 50 }, (_, index) => ({ id: start + index }))

export function Example() {
  const [data, setData] = React.useState(() => rows(10000))
  return (
    <>
      <button onClick={() => setData((current) => [...rows(current[0]!.id - 50), ...current])}>Load older messages</button>
      <Virtuoso
        computeItemKey={(_, item) => item.id}
        data={data}
        defaultItemHeight={120}
        firstItemIndex={data[0]!.id}
        increaseViewportBy={{ bottom: 0, top: 200 }}
        initialTopMostItemIndex={49}
        itemContent={(_, item) => (
          <div data-row-id={item.id} style={{ height: item.id % 2 ? 112 : 88 }}>
            Message {item.id}
          </div>
        )}
        style={{ height: 600 }}
      />
    </>
  )
}
