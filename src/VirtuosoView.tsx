import React, { ReactElement, useContext, FC, CSSProperties, useMemo } from 'react'
import { VirtuosoContext } from './VirtuosoContext'
import { useHeight, randomClassName } from './Utils'
import { VirtuosoScroller, TScrollContainer } from './VirtuosoScroller'
import { VirtuosoList, TRender } from './VirtuosoList'
import { ItemHeight } from 'VirtuosoStore'
import { VirtuosoStyle } from './Style'

export const DefaultListContainer: React.FC<{ className: string; listRef: (instance: HTMLElement | null) => void }> = ({
  className,
  children,
  listRef,
}) => {
  return (
    <div className={className} ref={listRef}>
      {children}
    </div>
  )
}

export type TListContainer = typeof DefaultListContainer

export { TScrollContainer }

const VirtuosoFooter: FC<{ footer: () => ReactElement }> = ({ footer }) => {
  const footerCallbackRef = useHeight(useContext(VirtuosoContext)!.footerHeight)

  return <footer ref={footerCallbackRef}>{footer()}</footer>
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
  item: TRender
  fixedItemHeight: boolean
}> = ({ style, footer, item, fixedItemHeight, ScrollContainer, ListContainer, className }) => {
  const { itemHeights, listHeight, viewportHeight, list, topList } = useContext(VirtuosoContext)!

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
          <VirtuosoList list={topList} render={item} pinnedClassName={pinnedClassName} />
          <VirtuosoList list={list} render={item} pinnedClassName={pinnedClassName} />
          {footer && <VirtuosoFooter footer={footer} />}
        </ListContainer>
      </div>

      <div className={fillerClassName}>&nbsp;</div>
      <VirtuosoStyle {...{ fillerClassName, listClassName, pinnedClassName, viewportClassName }} />
    </VirtuosoScroller>
  )
}
