import * as React from 'react'

import { CalculateViewLocation, Virtuoso, VirtuosoHandle } from '../src'

const calculateViewLocation: CalculateViewLocation = ({ itemBottom, itemTop, locationParams, viewportBottom, viewportTop }) => {
  const instantScrollThreshold = 500
  const padding = 50
  if (itemTop < viewportTop + padding && itemTop > padding) {
    const behavior = viewportTop - itemTop > instantScrollThreshold ? 'auto' : 'smooth'
    return { ...locationParams, align: 'start', behavior, offset: -padding }
  }
  if (itemBottom > viewportBottom - padding) {
    const behavior = itemBottom - viewportBottom > instantScrollThreshold ? 'auto' : 'smooth'
    return { ...locationParams, align: 'start', behavior, offset: -padding }
  }
  return null
}

const MIN_INDEX = 0
const MAX_INDEX = 2000

export function Example() {
  const virtuosoRef = React.useRef<VirtuosoHandle>(null)
  const [currentSubtitle, setCurrentSubtitle] = React.useState(MIN_INDEX)
  const autoScrollFlagRef = React.useRef(0)
  const [outOfSync, setOutOfSync] = React.useState(false)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'j') {
        setCurrentSubtitle((current) => Math.min(current + 1, MAX_INDEX))
      } else if (e.key === 'k') {
        setCurrentSubtitle((current) => Math.max(current - 1, MIN_INDEX))
      }
    }

    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
    }
  }, [])

  const intervalRef = React.useRef<ReturnType<typeof setInterval>>(null)

  React.useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentSubtitle((current) => current + 1)
    }, 500)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const goToSubtitle = React.useCallback(
    (index: number) => {
      // it is possible for a goToSubtitle to be called while another is in progress, that's why we use a numeric flag
      autoScrollFlagRef.current++

      virtuosoRef.current?.scrollIntoView({
        calculateViewLocation,
        done: () => {
          setOutOfSync(false)
          autoScrollFlagRef.current--
        },
        index,
      })
    },
    [virtuosoRef]
  )

  React.useEffect(() => {
    if (!outOfSync) {
      goToSubtitle(currentSubtitle)
    }
  }, [currentSubtitle, outOfSync, goToSubtitle])

  const syncBack = React.useCallback(() => {
    goToSubtitle(currentSubtitle)
  }, [currentSubtitle, goToSubtitle])

  return (
    <>
      <h1>Example of an autofollowing subtitle list.</h1>
      <p>
        Use <code>J</code>(down) or <code>K</code>(up) to scroll the list. The list will automatically scroll to the current subtitle.
      </p>

      <div style={{ position: 'relative' }}>
        <Virtuoso
          context={{ currentSubtitle }}
          itemContent={(index, _, { currentSubtitle }) => (
            <div style={{ paddingLeft: '1ex' }}>
              {index === currentSubtitle ? <span style={{ marginLeft: '-1ex' }}>&gt;</span> : null}Line {index}
            </div>
          )}
          onScroll={() => {
            if (autoScrollFlagRef.current === 0) {
              setOutOfSync(true)
            }
          }}
          ref={virtuosoRef}
          style={{ height: 500 }}
          totalCount={MAX_INDEX}
        />

        {outOfSync && (
          <button onClick={syncBack} style={{ position: 'absolute', right: 10, top: 10 }}>
            Catch up
          </button>
        )}
      </div>
    </>
  )
}
