import * as React from 'react'
import { useState } from 'react'
import { IndexLocationWithAlign, Virtuoso } from '../src'
import { IndexLocation } from '../src/scrollToIndexSystem'

globalThis['VIRTUOSO_LOG_LEVEL'] = 0

const itemContent = (index: number) => <div style={{ height: index % 2 ? 30 : 20, background: 'white' }}>Item {index}</div>

export function Example() {
  const NumberLocation = 60
  const ObjectLocation: IndexLocationWithAlign = { index: 80, align: 'end' }

  const [location, setLocation] = useState<IndexLocation>(NumberLocation)
  const [key, reMount] = useState(0)

  const onChangeLocation = (location: IndexLocation) => {
    setLocation(location)
    reMount((key) => ++key)
  }

  return (
    <>
      <div>
        <button onClick={() => onChangeLocation(NumberLocation)}>To 60</button> |{' '}
        <button id="initial-end-80" onClick={() => onChangeLocation(ObjectLocation)}>
          To 80 and align item to end
        </button>
      </div>
      <Virtuoso key={key} totalCount={100} itemContent={itemContent} initialTopMostItemIndex={location} style={{ height: 300 }} />
    </>
  )
}

export function ExampleWithSSR() {
  const NumberLocation = 60
  const ObjectLocation: IndexLocationWithAlign = { index: 80, align: 'end' }

  const [location, setLocation] = useState<IndexLocation>(NumberLocation)
  const [key, reMount] = useState(0)

  const onChangeLocation = (location: IndexLocation) => {
    setLocation(location)
    reMount((key) => ++key)
  }

  return (
    <>
      <div>
        <button onClick={() => onChangeLocation(NumberLocation)}>To 60</button> |{' '}
        <button id="initial-end-80" onClick={() => onChangeLocation(ObjectLocation)}>
          To 80 and align item to end
        </button>
      </div>
      <Virtuoso
        key={key}
        initialItemCount={40}
        totalCount={100}
        itemContent={itemContent}
        initialTopMostItemIndex={location}
        style={{ height: 300 }}
      />
    </>
  )
}
