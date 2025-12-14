# Virtuoso Masonry

[![npm version](https://img.shields.io/npm/v/@virtuoso.dev/masonry.svg)](https://www.npmjs.com/package/@virtuoso.dev/masonry) [![npm downloads](https://img.shields.io/npm/dm/@virtuoso.dev/masonry.svg)](https://www.npmjs.com/package/@virtuoso.dev/masonry) [![license](https://img.shields.io/npm/l/@virtuoso.dev/masonry.svg)](https://github.com/petyosi/react-virtuoso/blob/master/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A virtualized masonry layout component for React that arranges items in a grid with varying heights.

## Features

- **Virtualized rendering** - only renders visible items for optimal performance with large datasets
- **Variable item heights** - items can have different heights, automatically measured and arranged
- **Dynamic column count** - change column count based on screen/container width
- **Window scroll support** - can use the window as the scroll container
- **Just-in-time distribution** - items are distributed to columns as you scroll

:::note
The column distribution algorithm distributes the items just-in-time, so if you scroll very fast, you will be able to see the arrangement happening.
:::

## Installation

```bash
npm install @virtuoso.dev/masonry
```

## Quick Start

```tsx live
import { VirtuosoMasonry } from '@virtuoso.dev/masonry'
import { useMemo } from 'react'

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

## Window Scroll Example

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

## Links

- [Documentation](https://virtuoso.dev/masonry/)
- [API Reference](https://virtuoso.dev/masonry/api-reference/)
- [Contributing](https://github.com/petyosi/react-virtuoso/blob/master/CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
- [License](./LICENSE)
