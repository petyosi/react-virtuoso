import React, { FC, CSSProperties, useCallback, useRef } from 'react'

const scrollerStyle: React.CSSProperties = {
  height: '40rem',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  position: 'relative',
  outline: 'none',
}

export type TScrollContainer = FC<{
  style: CSSProperties
  className?: string
  reportScrollTop: (scrollTop: number) => void
  scrollTo: (callback: (scrollTop: number) => void) => void
}>

const DefaultScrollContainer: TScrollContainer = ({ className, style, reportScrollTop, scrollTo, children }) => {
  const elRef = useRef<HTMLElement | null>(null)

  const onScroll: EventListener = useCallback(
    (e: Event) => {
      reportScrollTop((e.target as HTMLDivElement).scrollTop)
    },
    [reportScrollTop]
  )

  const ref = useCallback(
    (theRef: HTMLElement | null) => {
      if (theRef) {
        theRef.addEventListener('scroll', onScroll, { passive: true })
        elRef.current = theRef
      } else {
        elRef.current!.removeEventListener('scroll', onScroll)
      }
    },
    [onScroll]
  )

  scrollTo(scrollTop => {
    elRef.current!.scrollTo({ top: scrollTop })
  })

  return (
    <div ref={ref} style={style} tabIndex={0} className={className}>
      {children}
    </div>
  )
}

export const VirtuosoScroller: FC<{
  className?: string
  style: CSSProperties
  ScrollContainer?: TScrollContainer
  scrollTop: (scrollTop: number) => void
  scrollTo: (callback: (scrollTop: number) => void) => void
}> = ({ children, style, className, ScrollContainer = DefaultScrollContainer, scrollTop, scrollTo }) => {
  return (
    <ScrollContainer
      style={{ ...scrollerStyle, ...style }}
      reportScrollTop={scrollTop}
      scrollTo={scrollTo}
      className={className}
    >
      {children}
    </ScrollContainer>
  )
}
