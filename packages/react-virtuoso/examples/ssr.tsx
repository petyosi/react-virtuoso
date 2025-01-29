import * as React from 'react'
import { Virtuoso } from '../src'

export function Example() {
  return (
    <Virtuoso
      initialItemCount={30}
      data={Array.from({ length: 100 }, (_, index) => {
        return { text: `Item ${index}` }
      })}
      itemContent={(_, item) => <div>{item.text}</div>}
      style={{ height: 300 }}
    />
  )
}
