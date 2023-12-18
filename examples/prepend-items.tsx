import * as React from 'react'
import { useState } from 'react'
import { Virtuoso } from '../src'

const Item = ({ index }: { index: number }) => {
  React.useEffect(() => {
    return () => {
      // eslint-disable-next-line no-console
      console.log(`unmounting ${index}`)
    }
  }, [index])

  return <div style={{ height: index % 2 ? 20 : 55 }}>Item {index}</div>
}
const itemContent = (index: number) => <Item index={index} />

const style = { height: 300 }
export default function App() {
  const [count, setCount] = useState(100)
  const [firstItemIndex, setFirstItemIndex] = useState(2000)
  const prepend = React.useCallback(
    (count: number) => () => {
      setCount((val) => val + count)
      setFirstItemIndex((val) => val - count)
    },
    []
  )
  return (
    <div>
      <button data-test-id="prepend-2" onClick={prepend(2)}>
        Prepend 2 Items
      </button>
      <button data-test-id="shift-2" onClick={prepend(-2)}>
        Shift 2 Items
      </button>
      <button data-test-id="prepend-200" onClick={prepend(200)}>
        Prepend 200 Items
      </button>
      <Virtuoso totalCount={count} firstItemIndex={firstItemIndex} itemContent={itemContent} style={style} />
    </div>
  )
}
