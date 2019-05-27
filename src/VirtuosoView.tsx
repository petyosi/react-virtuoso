import React, { ReactElement, useContext, FC, CSSProperties, useMemo } from 'react'
import { VirtuosoContext } from './VirtuosoContext'
import { useHeight, randomClassName, CallbackRef } from './Utils'
import { VirtuosoScroller, TScrollContainer } from './VirtuosoScroller'
import { VirtuosoList, TRender } from './VirtuosoList'
import { ItemHeight } from 'VirtuosoStore'
import { VirtuosoStyle } from './Style'

export const DefaultFooterContainer: React.FC<{ footerRef: CallbackRef }> = ({ children, footerRef }) => (
  <footer ref={footerRef}>{children}</footer>
)

export const DefaultListContainer: React.FC<{ className: string; listRef: CallbackRef }> = ({
  className,
  children,
  listRef,
}) => (
  <div className={className} ref={listRef}>
    {children}
  </div>
)

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

export const VirtuosoView: React.FC<{
  style: CSSProperties
  className?: string
  footer?: () => ReactElement
  ScrollContainer?: TScrollContainer
  ListContainer: TListContainer
  FooterContainer?: TFooterContainer
  item: TRender
  fixedItemHeight: boolean
}> = ({ style, footer, item, fixedItemHeight, ScrollContainer, ListContainer, FooterContainer, className }) => {
  const { itemHeights, listHeight, viewportHeight } = useContext(VirtuosoContext)!

  const fillerClassName = useMemo(randomClassName, [])
  const listClassName = useMemo(randomClassName, [])
  const pinnedClassName = useMemo(randomClassName, [])
  const viewportClassName = useMemo(randomClassName, [])

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

  const viewportCallbackRef = useHeight(viewportHeight)

  return (
    <VirtuosoScroller style={style} ScrollContainer={ScrollContainer} className={className}>
      <div className={viewportClassName} ref={viewportCallbackRef}>
        <ListContainer listRef={listCallbackRef} className={listClassName}>
          <VirtuosoList render={item} pinnedClassName={pinnedClassName} />
          {footer && <VirtuosoFooter footer={footer} FooterContainer={FooterContainer} />}
        </ListContainer>
      </div>

      <div className={fillerClassName}>&nbsp;</div>
      <VirtuosoStyle {...{ fillerClassName, listClassName, pinnedClassName, viewportClassName }} />
    </VirtuosoScroller>
  )
}
