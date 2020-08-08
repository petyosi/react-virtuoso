import * as React from 'react'
import { FC, CSSProperties, useCallback, useRef } from 'react'

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
  scrollTo: (callback: (scrollTop: ScrollToOptions) => void) => void
}>

const DefaultScrollContainer: TScrollContainer = ({ className, style, reportScrollTop, scrollTo, children }) => {
  const elRef = useRef<HTMLElement | null>(null)
  const smoothScrollTarget = useRef<number | null>(null)
  const currentScrollTop = useRef<number | null>()

  const onScroll: EventListener = useCallback(
    (e: Event) => {
      const scrollTop = (e.target as HTMLDivElement).scrollTop
      currentScrollTop.current = scrollTop
      if (smoothScrollTarget.current !== null) {
        if (smoothScrollTarget.current === scrollTop) {
          // console.log('reporting smooth scrolling')
          smoothScrollTarget.current = null
          reportScrollTop(scrollTop)
        } else {
          // console.log('skip reporting')
        }
      } else {
        reportScrollTop(scrollTop)
      }
    },
    [reportScrollTop]
  )

  const ref = useCallback(
    (theRef: HTMLElement | null) => {
      if (theRef) {
        theRef.addEventListener('scroll', onScroll, { passive: true })
        elRef.current = theRef
      } else {
        if (elRef.current) {
          elRef.current.removeEventListener('scroll', onScroll)
        }
      }
    },
    [onScroll]
  )

  scrollTo(location => {
    if (currentScrollTop.current !== location.top) {
      if (location.behavior === 'smooth') {
        smoothScrollTarget.current = location.top!
      }
      elRef.current && elRef.current!.scrollTo(location)
    }
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
  scrollTo: (callback: (scrollTop: ScrollToOptions) => void) => void
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
