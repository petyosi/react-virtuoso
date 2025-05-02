import { Virtuoso } from '../src'
import { useState, useCallback, forwardRef, useRef, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface SteamItem {
  _id: string
  label: string
  index: number
}

const generateItems = () => {
  const items = []

  for (let index = 0; index < 1000; index++) {
    items.push({
      _id: uuidv4(),
      label: `index ${index}`,
      index,
    })
  }

  return items
}

const StreamCardsWrapper = forwardRef<HTMLDivElement>((props, ref) => {
  return <div className="stream-cards-wrapper" ref={ref} {...props}></div>
})

const StreamCard = ({ children }: { children: ReactNode }) => {
  const [clicked, setClicked] = useState(false)

  return (
    <div
      className="stream-cards"
      style={{ backgroundColor: clicked ? 'red' : 'unset', height: 19 }}
      onClick={() => {
        setClicked(true)
      }}
    >
      {children}
    </div>
  )
}

const defaultItems = generateItems()

export function Example() {
  const listingRef = useRef<HTMLDivElement>(null)
  const virtuosoRef = useRef(null)

  const [firstItemIndex, setFirstItemIndex] = useState(1000)
  const [streamItems, setStreamItems] = useState<SteamItem[]>(defaultItems)

  const computeItemKey = useCallback((index: number, item: SteamItem) => {
    return item?._id || index
  }, [])

  const appendItem = useCallback(() => {
    setStreamItems((oldItems) => {
      const newIndex = oldItems[0].index - 1
      const newItem: SteamItem = {
        _id: uuidv4(),
        label: `index ${newIndex}`,
        index: newIndex,
      }
      return [newItem, ...oldItems]
    })
    setFirstItemIndex((old) => old - 1)
  }, [])

  console.log(streamItems)

  const getStreamItem = useCallback((_index: number, item: SteamItem) => {
    return <StreamCard key={item._id}>{item.label}</StreamCard>
  }, [])

  return (
    <>
      <button onClick={appendItem}>Append Item</button>
      <div id="stream-item-listing" style={{ height: 500, overflow: 'auto' }} ref={listingRef}>
        <Virtuoso
          customScrollParent={listingRef.current ?? undefined}
          skipAnimationFrameInResizeObserver
          firstItemIndex={firstItemIndex}
          ref={virtuosoRef}
          data={streamItems}
          computeItemKey={computeItemKey}
          components={{
            List: StreamCardsWrapper as any,
          }}
          increaseViewportBy={200}
          itemContent={getStreamItem}
        />
      </div>
    </>
  )
}
