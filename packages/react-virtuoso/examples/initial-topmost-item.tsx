import { useState } from 'react'

import { IndexLocationWithAlign, Virtuoso } from '../src'
import { IndexLocation } from '../src/scrollToIndexSystem'

// @ts-expect-error I know, I know, I know
globalThis.VIRTUOSO_LOG_LEVEL = 0

const itemContent = (index: number) => <div style={{ background: 'white', height: index % 2 ? 30 : 20 }}>Item {index}</div>

export function Example() {
  const NumberLocation = 60
  const ObjectLocation: IndexLocationWithAlign = { align: 'end', index: 80 }

  const [location, setLocation] = useState<IndexLocation>(NumberLocation)
  const [key, reMount] = useState(0)

  const onChangeLocation = (location: IndexLocation) => {
    setLocation(location)
    reMount((key) => ++key)
  }

  return (
    <>
      <div>
        <button
          onClick={() => {
            onChangeLocation(NumberLocation)
          }}
        >
          To 60
        </button>{' '}
        |{' '}
        <button
          id="initial-end-80"
          onClick={() => {
            onChangeLocation(ObjectLocation)
          }}
        >
          To 80 and align item to end
        </button>
      </div>
      <Virtuoso initialTopMostItemIndex={location} itemContent={itemContent} key={key} style={{ height: 300 }} totalCount={100} />
    </>
  )
}

export function ExampleWithSSR() {
  const NumberLocation = 60
  const ObjectLocation: IndexLocationWithAlign = { align: 'end', index: 80 }

  const [location, setLocation] = useState<IndexLocation>(NumberLocation)
  const [key, reMount] = useState(0)

  const onChangeLocation = (location: IndexLocation) => {
    setLocation(location)
    reMount((key) => ++key)
  }

  return (
    <>
      <div>
        <button
          onClick={() => {
            onChangeLocation(NumberLocation)
          }}
        >
          To 60
        </button>{' '}
        |{' '}
        <button
          id="initial-end-80"
          onClick={() => {
            onChangeLocation(ObjectLocation)
          }}
        >
          To 80 and align item to end
        </button>
      </div>
      <Virtuoso
        initialItemCount={40}
        initialTopMostItemIndex={location}
        itemContent={itemContent}
        key={key}
        style={{ height: 300 }}
        totalCount={100}
      />
    </>
  )
}
