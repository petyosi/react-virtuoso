import React, { ReactElement, useContext, FC, CSSProperties, useMemo } from 'react'
import { VirtuosoContext } from './VirtuosoContext'
import { useHeight, CallbackRef, useOutput } from './Utils'
import { VirtuosoScroller, TScrollContainer } from './VirtuosoScroller'
import { VirtuosoList, TRender } from './VirtuosoList'
import { ItemHeight } from 'VirtuosoStore'
import { VirtuosoStyle, randomClassName, viewportStyle } from './Style'
import { VirtuosoFiller } from './VirtuosoFiller'
import { TInput } from 'rxio'

export const DefaultFooterContainer: React.FC<{ footerRef: CallbackRef }> = ({ children, footerRef }) => (
  <footer ref={footerRef}>{children}</footer>
)

export const DefaultListContainer: React.FC<{ listRef: CallbackRef; style: CSSProperties }> = ({
  children,
  listRef,
  style,
}) => {
  return (
    <div ref={listRef} style={style}>
      {children}
    </div>
  )
}

export type TListContainer = typeof DefaultListContainer
export type TFooterContainer = typeof DefaultFooterContainer

export { TScrollContainer }

const VirtuosoFooter: FC<{ footer: () => ReactElement; FooterContainer?: TFooterContainer }> = ({
  footer,
  FooterContainer = DefaultFooterContainer,
}) => {
  const footerCallbackRef = useHeight(useContext(VirtuosoContext)!.footerHeight)
  return <FooterContainer footerRef={footerCallbackRef}>{footer()}</FooterContainer>
}

const getHeights = (children: HTMLCollection) => {
  const results: ItemHeight[] = []
  for (var i = 0, len = children.length; i < len; i++) {
    let child = children.item(i) as HTMLElement

    if (!child || child.dataset.index === undefined) {
      continue
    }

    const index = parseInt(child.dataset.index!)
    const knownSize = parseInt(child.dataset.knownSize!)
    const size = child.offsetHeight

    if (size === knownSize) {
      continue
    }

    const lastResult = results[results.length - 1]
    if (results.length === 0 || lastResult.size !== size || lastResult.end !== index - 1) {
      results.push({ start: index, end: index, size })
    } else {
      results[results.length - 1].end++
    }
  }

  return results
}

const ListWrapper: React.FC<{ fixedItemHeight: boolean; ListContainer: TListContainer }> = ({
  fixedItemHeight,
  children,
  ListContainer,
}) => {
  const { listHeight, itemHeights, listOffset } = useContext(VirtuosoContext)!
  const translate = useOutput<number>(listOffset, 0)
  const style = { marginTop: `${translate}px` }

  const listCallbackRef = useHeight(
    listHeight,
    () => {},
    ref => {
      if (!fixedItemHeight) {
        const measuredItemHeights = getHeights(ref!.children)
        if (measuredItemHeights.length > 0) {
          itemHeights(measuredItemHeights)
        }
      }
    }
  )

  return (
    <ListContainer listRef={listCallbackRef} style={style}>
      {children}
    </ListContainer>
  )
}

export const VirtuosoView: React.FC<{
  style: CSSProperties
  className?: string
  footer?: () => ReactElement
  ScrollContainer?: TScrollContainer
  ListContainer: TListContainer
  FooterContainer?: TFooterContainer
  item: TRender
  fixedItemHeight: boolean
  heightObserverTest: TInput<number>
}> = ({
  style,
  footer,
  item,
  fixedItemHeight,
  ScrollContainer,
  ListContainer,
  FooterContainer,
  className,
  heightObserverTest,
}) => {
  const { scrollTo, scrollTop, totalHeight, viewportHeight } = useContext(VirtuosoContext)!
  const fillerHeight = useOutput<number>(totalHeight, 0)
  const stickyClassName = useMemo(randomClassName, [])
  const fillerRef = useHeight(heightObserverTest)

  const viewportCallbackRef = useHeight(viewportHeight)

  return (
    <VirtuosoScroller
      style={style}
      ScrollContainer={ScrollContainer}
      className={className}
      scrollTo={scrollTo}
      scrollTop={scrollTop}
    >
      <div ref={viewportCallbackRef} style={viewportStyle}>
        <ListWrapper fixedItemHeight={fixedItemHeight} ListContainer={ListContainer}>
          <VirtuosoList render={item} stickyClassName={stickyClassName} />
          {footer && <VirtuosoFooter footer={footer} FooterContainer={FooterContainer} />}
        </ListWrapper>
      </div>

      <VirtuosoFiller fillerRef={fillerRef} height={fillerHeight} />
      <VirtuosoStyle {...{ stickyClassName }} />
    </VirtuosoScroller>
  )
}
