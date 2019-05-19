import React, { FC, useContext, CSSProperties, useCallback, useRef } from 'react'
import { VirtuosoContext } from './VirtuosoContext'

const scrollerStyle: React.CSSProperties = {
  height: '40rem',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  position: 'relative',
  outline: 'none',
}

export const VirtuosoScroller: FC<{ style: CSSProperties }> = ({ children, style }) => {
  const { scrollTop } = useContext(VirtuosoContext)!
  const elRef = useRef<HTMLElement | null>(null)

  const onScroll: EventListener = useCallback((e: Event) => {
    scrollTop((e.target as HTMLDivElement).scrollTop)
  }, [])

  const ref = useCallback((theRef: HTMLElement | null) => {
    if (theRef) {
      theRef.addEventListener('scroll', onScroll, { passive: true })
      elRef.current = theRef
    } else {
      elRef.current!.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div ref={ref} style={{ ...scrollerStyle, ...style }} tabIndex={0}>
      {children}
    </div>
  )
}
