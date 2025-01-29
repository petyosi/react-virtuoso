import React from 'react'

import { Virtuoso, VirtuosoGrid } from '../src/'

export function Example() {
  const [, setFoo] = React.useState(Symbol())
  const [bar, setBar] = React.useState<{ name: string }[]>([])

  return (
    <>
      <button
        onClick={() => {
          setFoo(Symbol())
        }}
      >
        Bam!
      </button>
      <button
        onClick={() => {
          setBar([{ name: 'test' }])
        }}
      >
        Jam
      </button>
      <Virtuoso initialItemCount={30} initialTopMostItemIndex={100} style={{ height: 300 }} totalCount={1000} />
      <hr />
      <Virtuoso
        data={bar}
        itemContent={(_, item) => {
          if (item === undefined) {
            debugger
          }
          return 'foo'
        }}
        style={{ height: 300 }}
      />
      <hr />
      <VirtuosoGrid initialItemCount={10} style={{ height: 300 }} totalCount={1000} />
    </>
  )
}
