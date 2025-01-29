import * as React from 'react'

import { LogLevel, Virtuoso } from '../src'

//
const itemContent = (index: number) => <div style={{ background: 'white', height: index % 2 ? 30 : 20 }}>Item {index}</div>

export function BombProps() {
  // const [channelId, setChannelId] = React.useState(1);
  useSuppressResizeObserverError()
  const [bogus, setBogus] = React.useState(0)
  const [key, setKey] = React.useState(0)

  React.useEffect(() => {
    setTimeout(() => {
      setBogus((prev) => prev + 1)
      setTimeout(() => {
        setBogus((prev) => prev + 1)
        setTimeout(() => {
          setBogus((prev) => prev + 1)
          setTimeout(() => {
            setBogus((prev) => prev + 1)
          }, 2)
        }, 2)
      }, 2)
    }, 2)
  }, [key])

  return (
    <div className="App">
      <button
        onClick={() => {
          setKey((k) => k + 1)
        }}
      >
        Change channel
      </button>
      {/*
      <button
        onClick={() => {
          setChannelId(1);
        }}
      >
        Channel 1
      </button>

      <button
        onClick={() => {
          setChannelId(2);
        }}
      >
        Channel 2
      </button>

      <button
        onClick={() => {
          setChannelId(3);
        }}
      >
        Channel 3
      </button>
      */}

      <Virtuoso
        alignToBottom={true}
        context={{ bogus }}
        defaultItemHeight={50}
        followOutput="auto"
        increaseViewportBy={100}
        initialTopMostItemIndex={14}
        itemContent={(index: number) => {
          return (
            <div
              style={{
                background: index % 2 ? 'red' : 'blue',
                height: index % 2 ? 450 : 560,
              }}
            >
              Item {index}
            </div>
          )
        }}
        key={`channel-${key}`}
        logLevel={LogLevel.DEBUG}
        style={{ height: 800 }}
        totalCount={15}
      />
    </div>
  )
}

export function Example() {
  return (
    <div>
      <h2>Randomly buggy in safari, container height gets reported later</h2>
      <Virtuoso defaultItemHeight={30} initialTopMostItemIndex={60} itemContent={itemContent} style={{ height: 300 }} totalCount={100} />
    </div>
  )
}

function useSuppressResizeObserverError() {
  React.useEffect(() => {
    const cb = (e: ErrorEvent) => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        e.preventDefault()
      }
    }
    window.addEventListener('error', cb)
    return () => {
      window.removeEventListener('error', cb)
    }
  }, [])
}
