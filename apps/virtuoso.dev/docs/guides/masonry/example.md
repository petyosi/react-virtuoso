---
id: masonry
title: Masonry
sidebar_label: Basic Example
slug: /hello-masonry/
position: 1
---

# Masonry

The Masonry component is a layout component that arranges items in a grid with varying heights. It is useful for displaying images, cards, product images, etc.
The column count property can be changed dynamically based on the screen/container width.

:::note
The column distribution algorithm distributes the items just-in-time, so if you scroll very fast, you will be able to see the arrangement happening.
:::

To add the component to your project, install the `@virtuoso.dev/masonry` NPM package.

```bash
npm install @virtuoso.dev/masonry
```

## Basic example

```tsx live
import { VirtuosoMasonry } from '@virtuoso.dev/masonry'
import { useEffect, useMemo, useState } from 'react'

const ItemContent: React.FC<{ data: number }> = ({ data }) => {
  const height = data % 10 === 0 ? 200 : data % 5 === 0 ? 180 : data % 7 ? 150 : 120
  return (
    <div style={{ padding: '5px' }}>
      <div style={{ height, border: '1px solid black' }}>Item {data}</div>
    </div>
  )
}

export default function App() {
  const data = useMemo(() => {
    return Array.from({ length: 1000 }, (_, index) => index)
  }, [])

  return (
    <div>
      <VirtuosoMasonry columnCount={3} data={data} style={{ height: 500 }} initialItemCount={50} ItemContent={ItemContent} />
    </div>
  )
}
```

## Window scroll example

```tsx live
import { VirtuosoMasonry } from '@virtuoso.dev/masonry'
import { useEffect, useMemo, useState } from 'react'

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return width
}

const ItemContent: React.FC<{ data: number }> = ({ data }) => {
  const height = data % 10 === 0 ? 200 : data % 5 === 0 ? 180 : data % 7 ? 150 : 120
  return (
    <div style={{ padding: '5px' }}>
      <div style={{ height, border: '1px solid black' }}>Item {data}</div>
    </div>
  )
}

export default function App() {
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
      <VirtuosoMasonry columnCount={columnCount} data={data} useWindowScroll={true} initialItemCount={50} ItemContent={ItemContent} />
    </div>
  )
}
```
