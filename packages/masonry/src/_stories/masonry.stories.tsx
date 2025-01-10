import { useEffect, useMemo, useState } from 'react'
import { VirtuosoMasonry } from '../VirtuosoMasonry'

const ItemContent: React.FC<{ data: number }> = ({ data }) => {
  const height = data % 10 === 0 ? 200 : data % 5 === 0 ? 100 : data % 7 === 0 ? 70 : 50
  return (
    <div style={{ padding: '5px', height, boxSizing: 'border-box', border: '1px solid black' }}>
      <div>Item {data}</div>
    </div>
  )
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
          height: 400,
          border: '1px solid black',
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
      <div style={{ height: 200, border: '1px solid black' }}>
        <h1>Header</h1>
      </div>
      <VirtuosoMasonry
        useWindowScroll
        columnCount={3}
        initialItemCount={20}
        data={data}
        ItemContent={ItemContent}
        style={{
          border: '1px solid black',
        }}
      />
    </div>
  )
}
