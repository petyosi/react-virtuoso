import * as React from 'react'

import { StateSnapshot, TableVirtuoso, TableVirtuosoHandle } from '../src/'

export function Example() {
  const ref = React.useRef<TableVirtuosoHandle>(null)
  const state = React.useRef<StateSnapshot | undefined>(undefined)
  const [key, setKey] = React.useState(0)

  console.log('Rendering with key', key)
  return (
    <div>
      <button
        onClick={() => {
          ref.current?.getState((snapshot) => {
            state.current = snapshot
          })
          setKey((value) => value + 1)
        }}
      >
        Rerender + Log State
      </button>

      <TableVirtuoso
        components={{
          TableRow: ({ style, ...props }) => <tr style={{ height: props['data-index'] % 2 ? 15 : 60, ...style }} {...props} />,
        }}
        computeItemKey={(key: number) => `item-${key.toString()}`}
        fixedHeaderContent={() => (
          <tr>
            <th style={{ background: 'blue', color: 'white', width: 75 }}>Item</th>
            <th style={{ background: 'blue', color: 'white', width: 75 }}>Col 1</th>
            <th style={{ background: 'blue', color: 'white', width: 75 }}>Col 2</th>
            <th style={{ background: 'blue', color: 'white', width: 75 }}>Col 3</th>
            <th style={{ background: 'blue', color: 'white', width: 75 }}>Col 4</th>
          </tr>
        )}
        itemContent={(index) => (
          <>
            <td style={{ border: '1px solid gray' }}>Item {index}</td>
            <td style={{ border: '1px solid gray' }}>Col {index}-1</td>
            <td style={{ border: '1px solid gray' }}>Col {index}-2</td>
            <td style={{ border: '1px solid gray' }}>Col {index}-3</td>
            <td style={{ border: '1px solid gray' }}>Col {index}-4</td>
          </>
        )}
        key={key}
        ref={ref}
        restoreStateFrom={state.current}
        style={{ height: 400, marginTop: 8 }}
        totalCount={250}
      />
    </div>
  )
}
