import React from 'react'
import { Virtuoso, VirtuosoGrid } from '../src/'

export function Example() {
  const [, setFoo] = React.useState(Symbol())
  const [bar, setBar] = React.useState<Array<{ name: string }>>([])

  return (
    <>
      <button onClick={() => setFoo(Symbol())}>Bam!</button>
      <button onClick={() => setBar([{ name: 'test' }])}>Jam</button>
      <Virtuoso initialItemCount={30} totalCount={1000} style={{ height: 300 }} initialTopMostItemIndex={100} />
      <hr />
      <Virtuoso
        data={bar}
        style={{ height: 300 }}
        itemContent={(_, item) => {
          if (item === undefined) {
            debugger
          }
          return 'foo'
        }}
      />
      <hr />
      <VirtuosoGrid initialItemCount={10} totalCount={1000} style={{ height: 300 }} />
    </>
  )
}
