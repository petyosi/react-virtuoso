import { useEffect, useState } from 'react'

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
        height: loaded ? 50 : 100,
        outline: `1px solid green`,
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
        itemContent={(index) => {
          return <Item index={index} />
        }}
        style={{ height: 300 }}
        totalCount={100}
      />
    </div>
  )
}
