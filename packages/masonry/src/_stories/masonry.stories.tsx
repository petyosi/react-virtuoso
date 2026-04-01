import { useEffect, useMemo, useRef, useState } from 'react'

import { VirtuosoMasonry } from '../VirtuosoMasonry'

const ItemContent: React.FC<{ data: number }> = ({ data }) => {
  const height = data % 10 === 0 ? 200 : data % 5 === 0 ? 100 : data % 7 === 0 ? 70 : 50
  return (
    <div style={{ border: '1px solid black', boxSizing: 'border-box', height, padding: '5px' }}>
      <div>Item {data}</div>
    </div>
  )
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  return width
}

export const Example = () => {
  const data = useMemo(() => {
    return Array.from({ length: 1000 }, (_, index) => index)
  }, [])
  const width = useWindowWidth()

  const columnCount = useMemo(() => {
    if (width < 500) {
      return 2
    }
    if (width < 800) {
      return 3
    }
    return 4
  }, [width])

  return (
    <div>
      <VirtuosoMasonry
        columnCount={columnCount}
        data={data}
        ItemContent={ItemContent}
        style={{
          border: '1px solid black',
          height: 400,
        }}
      />
    </div>
  )
}

export const WindowExample = () => {
  const data = useMemo(() => {
    return Array.from({ length: 1000 }, (_, index) => index)
  }, [])
  return (
    <div>
      <div style={{ border: '1px solid black', height: 200 }}>
        <h1>Header</h1>
      </div>
      <VirtuosoMasonry
        columnCount={3}
        data={data}
        initialItemCount={20}
        ItemContent={ItemContent}
        style={{
          border: '1px solid black',
        }}
        // oxlint-disable-next-line typescript-eslint(no-deprecated) -- example for deprecated prop
        useWindowScroll
      />
    </div>
  )
}

export const ScrollElementRefExample = () => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const data = useMemo(() => {
    return Array.from({ length: 1000 }, (_, index) => index)
  }, [])
  return (
    <div>
      <div
        ref={scrollerRef}
        style={{
          border: '2px solid blue',
          height: '80vh',
          overflow: 'auto',
        }}
      >
        <div style={{ background: '#eee', padding: 16 }}>
          <h2 style={{ margin: 0 }}>Header inside scroll container</h2>
          <p style={{ margin: '8px 0 0' }}>This header scrolls with the masonry grid below.</p>
        </div>
        <VirtuosoMasonry
          columnCount={3}
          data={data}
          ItemContent={ItemContent}
          scrollElementRef={scrollerRef}
          style={{
            border: '1px solid black',
          }}
        />
      </div>
    </div>
  )
}

export const DynamicDataExample = () => {
  const [data, setData] = useState(() => {
    return Array.from({ length: 0 }, (_, index) => index)
  })

  return (
    <div>
      <button
        onClick={() => {
          setData((prevData) => {
            return [...prevData, ...Array.from({ length: 2 }, (_, index) => index)]
          })
        }}
      >
        Add data
      </button>
      <VirtuosoMasonry
        columnCount={8}
        data={data}
        ItemContent={ItemContent}
        style={{
          border: '1px solid black',
          height: 400,
        }}
      />
    </div>
  )
}
