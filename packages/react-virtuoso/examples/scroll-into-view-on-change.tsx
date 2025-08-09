import * as React from 'react'

import { Virtuoso, VirtuosoHandle } from '../src'
import { useState } from 'react'

export function TotalCountChange() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const [currentItemIndex, setCurrentItemIndex] = React.useState(-1)
  const [nextIndex, setNextIndex] = React.useState(-1)
  const [count, setCount] = React.useState(100)
  const increment = 50
  const bottomOffset = 10

  return (
    <div>
      <button
        id="add-and-scroll"
        style={{ whiteSpace: 'nowrap' }}
        onClick={() => {
          const newCount = count + increment
          setNextIndex(newCount - bottomOffset)
          setCount(newCount)
          return false
        }}
      >
        Add {increment} and go to {count + (increment - bottomOffset)}
      </button>
      <Virtuoso
        ref={ref}
        totalCount={count}
        context={{ currentItemIndex, nextIndex }}
        scrollIntoViewOnChange={({ context: { nextIndex } }) => {
          return {
            align: `start`,
            index: nextIndex,
            behavior: 'auto',
            done: () => {
              setCurrentItemIndex(nextIndex)
            },
          }
        }}
        itemContent={(index, _, { currentItemIndex }) => (
          <div style={{ background: 'white', color: index === currentItemIndex ? 'red' : 'black', height: 50 }}>Item {index}</div>
        )}
        style={{ height: 300 }}
      />
    </div>
  )
}
const generateData = (count: number) => Array.from({ length: count }, (_, i) => `Item ${i}`)

export function DataChange() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const [currentItemIndex, setCurrentItemIndex] = React.useState(-1)
  const [nextIndex, setNextIndex] = React.useState(-1)
  const [count, setCount] = React.useState(100)
  const increment = 50
  const bottomOffset = 10
  const [data, setData] = useState(() => generateData(100))

  return (
    <div>
      <button
        id="add-and-scroll"
        style={{ whiteSpace: 'nowrap' }}
        onClick={() => {
          const newCount = count + increment
          setNextIndex(newCount - bottomOffset)
          setCount(newCount)
          setData(generateData(newCount))
          return false
        }}
      >
        Add {increment} and go to {count + (increment - bottomOffset)}
      </button>
      <Virtuoso
        ref={ref}
        data={data}
        context={{ currentItemIndex, nextIndex }}
        scrollIntoViewOnChange={({ context: { nextIndex } }) => {
          return {
            align: `start`,
            index: nextIndex,
            behavior: 'auto',
            done: () => {
              setCurrentItemIndex(nextIndex)
            },
          }
        }}
        itemContent={(index, data, { currentItemIndex }) => (
          <div style={{ background: 'white', color: index === currentItemIndex ? 'red' : 'black', height: 50 }}>{data}</div>
        )}
        style={{ height: 300 }}
      />
    </div>
  )
}
