import * as React from 'react'

import { Components, Virtuoso } from '../src'

const components: Components<null, { key: string }> = {
  Header: ({ context }) => <div>Header - {JSON.stringify(context)}</div>,
}
export function Example() {
  const [context, setContext] = React.useState({ key: 'value' })
  return (
    <>
      <button
        onClick={() => {
          setContext({ key: 'value2' })
        }}
      >
        Ping
      </button>
      <Virtuoso
        components={components}
        computeItemKey={(key: number) => `item-${key.toString()}`}
        context={context}
        initialItemCount={30}
        itemContent={(index, _, { key }) => (
          <div style={{ height: 30 }}>
            Item {index} - {key}
          </div>
        )}
        style={{ height: 300 }}
        totalCount={100}
      />
    </>
  )
}
