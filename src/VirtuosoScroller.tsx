import React, { FC, useContext, CSSProperties } from 'react'
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

  return (
    <div
      onScroll={e => scrollTop((e.target as HTMLDivElement).scrollTop)}
      style={{ ...scrollerStyle, ...style }}
      tabIndex={0}
    >
      {children}
    </div>
  )
}
