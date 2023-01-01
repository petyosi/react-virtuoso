import * as React from 'react'
import { useState, useCallback } from 'react'
import { Virtuoso, VirtuosoHandle } from '../src'

const Image = ({ index }: { index: number }) => {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (index % 3 === 1) {
      setTimeout(() => {
        ref.current!.style.height = '200px'
        ref.current!.style.background = 'red'
        ref.current!.dispatchEvent(new Event('customLoad', { bubbles: true }))
      }, Math.random() * 100 + 200)
    }
  })
  return (
    <div style={{ height: 30 }} ref={ref}>
      Item {index}
    </div>
  )
}
export function Example() {
  const [count] = useState(100)
  const ref = React.useRef<HTMLDivElement>(null)
  const virtuosoRef = React.useRef<VirtuosoHandle>(null)
  const itemContent = useCallback((index: number) => {
    return <Image index={index} />
  }, [])

  React.useEffect(() => {
    ref.current!.addEventListener('customLoad', () => {
      virtuosoRef.current?.autoscrollToBottom()
    })
  }, [])

  return (
    <div ref={ref}>
      <Virtuoso
        ref={virtuosoRef}
        totalCount={count}
        initialTopMostItemIndex={99}
        followOutput={'auto'}
        itemContent={itemContent}
        style={{ height: 700 }}
      />
    </div>
  )
}
