import * as React from 'react'
import { Virtuoso, TableVirtuoso } from '../src'

export function Example() {
  const [total, setTotal] = React.useState(10)
  return (
    <div style={{ display: 'flex', height: '500px', flexDirection: 'column', border: '1px solid red' }}>
      <Virtuoso
        computeItemKey={(key) => `item-${key}`}
        alignToBottom={true}
        totalCount={total}
        followOutput={'smooth'}
        itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
        style={{ height: '100%', flex: 1 }}
        components={{
          Header: () => <div>header</div>,
        }}
      />
      <div style={{ padding: '1rem' }}>
        <button onClick={() => setTotal((val) => val + 2)}>bump</button>
      </div>
    </div>
  )
}

export function TableExample() {
  return (
    <TableVirtuoso
      alignToBottom={true}
      style={{ height: 400, border: '1px solid red' }}
      data={['foo', 'bar', 'baz']}
      itemContent={(index, string) => (
        <>
          <td>{index}</td>
          <td style={{ width: 150 }}>{string}</td>
          <td>{string}</td>
        </>
      )}
    />
  )
}
