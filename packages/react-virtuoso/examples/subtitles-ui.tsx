import * as React from 'react'
import { Virtuoso, VirtuosoHandle, CalculateViewLocation } from '../src'

const calculateViewLocation: CalculateViewLocation = ({ itemTop, itemBottom, viewportTop, viewportBottom, locationParams }) => {
  const instantScrollThreshold = 500
  const padding = 50
  if (itemTop < viewportTop + padding && itemTop > padding) {
    const behavior = viewportTop - itemTop > instantScrollThreshold ? 'auto' : 'smooth'
    return { ...locationParams, behavior, align: 'start', offset: -padding }
  }
  if (itemBottom > viewportBottom - padding) {
    const behavior = itemBottom - viewportBottom > instantScrollThreshold ? 'auto' : 'smooth'
    return { ...locationParams, behavior, align: 'start', offset: -padding }
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
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const intervalRef = React.useRef<ReturnType<typeof setInterval>>()

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
        index,
        calculateViewLocation,
        done: () => {
          setOutOfSync(false)
          autoScrollFlagRef.current--
        },
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
  }, [currentSubtitle])

  return (
    <>
      <h1>Example of an autofollowing subtitle list.</h1>
      <p>
        Use <code>J</code>(down) or <code>K</code>(up) to scroll the list. The list will automatically scroll to the current subtitle.
      </p>

      <div style={{ position: 'relative' }}>
        <Virtuoso
          onScroll={() => {
            if (autoScrollFlagRef.current === 0) {
              setOutOfSync(true)
            }
          }}
          context={{ currentSubtitle }}
          ref={virtuosoRef}
          totalCount={MAX_INDEX}
          itemContent={(index, _, { currentSubtitle }) => (
            <div style={{ paddingLeft: '1ex' }}>
              {index === currentSubtitle ? <span style={{ marginLeft: '-1ex' }}>&gt;</span> : null}Line {index}
            </div>
          )}
          style={{ height: 500 }}
        />

        {outOfSync && (
          <button style={{ position: 'absolute', top: 10, right: 10 }} onClick={syncBack}>
            Catch up
          </button>
        )}
      </div>
    </>
  )
}
