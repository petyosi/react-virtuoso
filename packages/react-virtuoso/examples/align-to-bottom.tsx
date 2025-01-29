import { useState } from 'react'

import { TableVirtuoso, Virtuoso } from '../src'

export function Example() {
  const [total, setTotal] = useState(10)
  return (
    <div style={{ border: '1px solid red', display: 'flex', flexDirection: 'column', height: '500px' }}>
      <Virtuoso
        alignToBottom={true}
        components={{
          Header: () => <div>header</div>,
        }}
        computeItemKey={(key) => `item-${key}`}
        followOutput={'smooth'}
        itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
        style={{ flex: 1, height: '100%' }}
        totalCount={total}
      />
      <div style={{ padding: '1rem' }}>
        <button
          onClick={() => {
            setTotal((val) => val + 2)
          }}
        >
          bump
        </button>
      </div>
    </div>
  )
}

export function TableExample() {
  return (
    <TableVirtuoso
      alignToBottom={true}
      data={['foo', 'bar', 'baz']}
      itemContent={(index, string) => (
        <>
          <td>{index}</td>
          <td style={{ width: 150 }}>{string}</td>
          <td>{string}</td>
        </>
      )}
      style={{ border: '1px solid red', height: 400 }}
    />
  )
}
