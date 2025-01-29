import * as React from 'react'
import { useState, useEffect } from 'react'
import { Virtuoso } from '../src'

const Item = (props: { index: number }) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const to = setTimeout(() => {
      setLoaded(true)
    }, 200)

    return () => {
      clearTimeout(to)
    }
  }, [])

  return (
    <div
      style={{
        outline: `1px solid green`,
        height: loaded ? 50 : 100,
      }}
    >
      {loaded ? `Item ${props.index}` : `Loading...`}
    </div>
  )
}

export function Example() {
  return (
    <div className="App" style={{ height: 300, outline: `1px solid red` }}>
      <Virtuoso
        style={{ height: 300 }}
        itemContent={(index) => {
          return <Item index={index} />
        }}
        totalCount={100}
      />
    </div>
  )
}
