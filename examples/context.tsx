import * as React from 'react'
import { Virtuoso, Components } from '../src'

const components: Components = {
  Header: ({ context }) => <div>Header - {JSON.stringify(context)}</div>,
}
export default function App() {
  const [context, setContext] = React.useState({ key: 'value' })
  return (
    <>
      <button onClick={() => setContext({ key: 'value2' })}>Ping</button>
      <Virtuoso
        context={context}
        components={components}
        computeItemKey={(key: number) => `item-${key.toString()}`}
        initialItemCount={30}
        totalCount={100}
        itemContent={(index, _, { key }) => (
          <div style={{ height: 30 }}>
            Item {index} - {key}
          </div>
        )}
        style={{ height: 300 }}
      />
    </>
  )
}
