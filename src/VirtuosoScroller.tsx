import React, { FC, useContext, useCallback, UIEvent, CSSProperties } from 'react'
import { VirtuosoContext } from './VirtuosoContext'

const scrollerStyle: React.CSSProperties = {
  height: '40rem',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  position: 'relative',
}

export const VirtuosoScroller: FC<{ style: CSSProperties }> = ({ children, style }) => {
  const { scrollTop$ } = useContext(VirtuosoContext)!

  const onScroll = useCallback((e: UIEvent) => {
    scrollTop$.next((e.target as HTMLDivElement).scrollTop)
  }, [])

  const ref = useCallback(ref => {
    if (ref) {
      ref.addEventListener('scroll', onScroll, { passive: true })
    }
  }, [])

  return (
    <div ref={ref} style={{ ...scrollerStyle, ...style }}>
      {children}
    </div>
  )
}
