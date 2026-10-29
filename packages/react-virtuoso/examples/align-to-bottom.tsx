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

function PrependList({ initialCount }: { initialCount: number }) {
  const [data, setData] = useState(() => Array.from({ length: initialCount }, (_, index) => 1000 + index))
  return (
    <div>
      <button
        data-testid="prepend-1"
        onClick={() => {
          setData((current) => [current[0]! - 1, ...current])
        }}
      >
        Prepend 1 item
      </button>
      <Virtuoso
        alignToBottom={true}
        data={data}
        firstItemIndex={data[0]!}
        initialTopMostItemIndex={initialCount - 1}
        itemContent={(_, id) => (
          <div data-row-id={id} style={{ height: 30 }}>
            Item {id}
          </div>
        )}
        style={{ height: 300 }}
      />
    </div>
  )
}

export function Prepend() {
  return <PrependList initialCount={3} />
}

export function PrependScrollable() {
  return <PrependList initialCount={20} />
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
