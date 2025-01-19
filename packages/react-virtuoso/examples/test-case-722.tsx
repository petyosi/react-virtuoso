import * as React from 'react'
import { useState } from 'react'
import { Virtuoso } from '../src'

const TOTAL_COUNT = 233
const PAGE_COUNT = 30

// scroll up to 143, should load as expected. - https://github.com/petyosi/react-virtuoso/issues/722
const SHORT_IDX = {
  13: true,
  20: true,
  22: true,
  26: true,
  43: true,

  99: true,
  100: true,
  101: true,
  102: true,
  103: true,
  104: true,
  105: true,
  106: true,
  107: true,
  108: true,

  109: true,
  110: true,
  111: true,
  112: true,
  113: true,
  114: true,
  115: true,
  116: true,
  117: true,
  118: true,
  121: true,
  122: true,
  123: true,
  124: true,
  125: true,
  127: true,
  128: true,
  129: true,
  136: true,
  141: true,
  142: true,
  143: true,
  144: true,
  145: true,

  151: true,
  152: true,
  157: true,
  159: true,
  158: true,

  160: true,
  161: true,
  162: true,
  182: true,
}

export function Example() {
  const [loadedCount, setLoadedCount] = useState(PAGE_COUNT)

  const prepend = () => {
    setTimeout(() => {
      if (loadedCount < TOTAL_COUNT) setLoadedCount(loadedCount + PAGE_COUNT > TOTAL_COUNT ? TOTAL_COUNT : loadedCount + PAGE_COUNT)
    }, 250)
  }

  return (
    <div className="App">
      <Virtuoso
        startReached={prepend}
        useWindowScroll
        overscan={0}
        firstItemIndex={TOTAL_COUNT - loadedCount}
        totalCount={loadedCount}
        itemContent={(index) => {
          return <div style={{ height: SHORT_IDX[index] ? '15px' : '150px' }}>{index}</div>
        }}
      />
    </div>
  )
}
