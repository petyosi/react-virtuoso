import React, { CSSProperties, FC, ReactElement, useContext } from 'react'
import { ItemHeight } from 'VirtuosoStore'
import { viewportStyle } from './Style'
import { CallbackRef, useHeight, useOutput } from './Utils'
import { VirtuosoContext } from './VirtuosoContext'
import { VirtuosoFiller } from './VirtuosoFiller'
import { VirtuosoList } from './VirtuosoList'
import { TScrollContainer, VirtuosoScroller } from './VirtuosoScroller'

export const DefaultHeaderContainer: React.FC<{ headerRef: CallbackRef }> = ({ children, headerRef }) => (
  <header ref={headerRef}>{children}</header>
)

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
export type THeaderContainer = typeof DefaultHeaderContainer
export type TFooterContainer = typeof DefaultFooterContainer

export { TScrollContainer }

const VirtuosoHeader: FC<{ header: () => ReactElement; HeaderContainer?: THeaderContainer }> = ({
  header,
  HeaderContainer = DefaultHeaderContainer,
}) => {
  const headerCallbackRef = useHeight(useContext(VirtuosoContext)!.headerHeight)
  return <HeaderContainer headerRef={headerCallbackRef}>{header()}</HeaderContainer>
}

const VirtuosoFooter: FC<{ footer: () => ReactElement; FooterContainer?: TFooterContainer }> = ({
  footer,
  FooterContainer = DefaultFooterContainer,
}) => {
  const footerCallbackRef = useHeight(useContext(VirtuosoContext)!.footerHeight)
  return <FooterContainer footerRef={footerCallbackRef}>{footer()}</FooterContainer>
}

const getHeights = (children: HTMLCollection) => {
  const results: ItemHeight[] = []
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children.item(i) as HTMLElement

    if (!child || child.dataset.index === undefined) {
      continue
    }

    const index = parseInt(child.dataset.index!)
    const knownSize = parseInt(child.dataset.knownSize!)
    const size = child.offsetHeight

    if (size === knownSize || size === 0) {
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
        itemHeights(measuredItemHeights)
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
  header?: () => ReactElement
  footer?: () => ReactElement
  ScrollContainer?: TScrollContainer
  ListContainer: TListContainer
  HeaderContainer?: THeaderContainer
  FooterContainer?: TFooterContainer
  fixedItemHeight: boolean
  emptyComponent?: React.ReactNode
}> = ({
  style,
  header,
  footer,
  fixedItemHeight,
  ScrollContainer,
  ListContainer,
  HeaderContainer,
  FooterContainer,
  className,
  emptyComponent,
}) => {
  const { scrollTo, scrollTop, totalHeight, viewportHeight } = useContext(VirtuosoContext)!
  const fillerHeight = useOutput<number>(totalHeight, 0)
  const reportScrollTop = (st: number) => {
    scrollTop(Math.max(st, 0))
  }

  const viewportCallbackRef = useHeight(viewportHeight)

  return (
    <VirtuosoScroller
      style={style}
      ScrollContainer={ScrollContainer}
      className={className}
      scrollTo={scrollTo}
      scrollTop={reportScrollTop}
    >
      <div ref={viewportCallbackRef} style={viewportStyle}>
        <ListWrapper fixedItemHeight={fixedItemHeight} ListContainer={ListContainer}>
          {header && <VirtuosoHeader header={header} HeaderContainer={HeaderContainer} />}
          <VirtuosoList emptyComponent={emptyComponent} />
          {footer && <VirtuosoFooter footer={footer} FooterContainer={FooterContainer} />}
        </ListWrapper>
      </div>

      <VirtuosoFiller height={fillerHeight} />
    </VirtuosoScroller>
  )
}
