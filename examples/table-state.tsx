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
        key={key}
        ref={ref}
        style={{ height: 400, marginTop: 8 }}
        restoreStateFrom={state.current}
        computeItemKey={(key: number) => `item-${key.toString()}`}
        totalCount={250}
        components={{
          TableRow: ({ style, ...props }) => <tr style={{ height: props['data-index'] % 2 ? 15 : 60, ...style }} {...props} />,
        }}
        fixedHeaderContent={() => (
          <tr>
            <th style={{ width: 75, background: 'blue', color: 'white' }}>Item</th>
            <th style={{ width: 75, background: 'blue', color: 'white' }}>Col 1</th>
            <th style={{ width: 75, background: 'blue', color: 'white' }}>Col 2</th>
            <th style={{ width: 75, background: 'blue', color: 'white' }}>Col 3</th>
            <th style={{ width: 75, background: 'blue', color: 'white' }}>Col 4</th>
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
      />
    </div>
  )
}
