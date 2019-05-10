import React, { FC, useContext, useCallback, UIEvent } from 'react'
import { VirtuosoContext } from './VirtuosoContext'

const scrollerStyle: React.CSSProperties = {
  height: '100%',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  position: 'relative',
}

export const VirtuosoScroller: FC = ({ children }) => {
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
    <div ref={ref} style={scrollerStyle}>
      {children}
    </div>
  )
}
