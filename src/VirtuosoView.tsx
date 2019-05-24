import React, { ReactElement, useContext, FC, CSSProperties, useCallback } from 'react'
import { VirtuosoContext } from './VirtuosoContext'
import { useHeight, useOutput } from './Utils'
import { VirtuosoScroller, TScrollContainer } from './VirtuosoScroller'
import { VirtuosoList, TRender } from './VirtuosoList'
import { ItemHeight } from 'VirtuosoStore'

const VirtuosoFiller: FC<{}> = () => {
  const totalHeight = useOutput<number>(useContext(VirtuosoContext)!.totalHeight, 0)

  return <div style={{ height: `${totalHeight}px`, position: 'absolute', top: 0 }}>&nbsp;</div>
}

const VirtuosoFooter: FC<{ footer: () => ReactElement }> = ({ footer }) => {
  const footerCallbackRef = useHeight(useContext(VirtuosoContext)!.footerHeight)

  return <footer ref={footerCallbackRef}>{footer()}</footer>
}

const viewportStyle: CSSProperties = {
  top: 0,
  position: 'sticky',
  height: '100%',
  overflow: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
}

export const VirtuosoView: React.FC<{
  style: CSSProperties
  className?: string
  footer?: () => ReactElement
  ScrollContainer?: TScrollContainer
  item: TRender
  fixedItemHeight: boolean
}> = ({ style, footer, item, fixedItemHeight, ScrollContainer, className }) => {
  const { itemHeights, listHeight, viewportHeight, listOffset, list, topList } = useContext(VirtuosoContext)!

  const translate = useOutput<number>(listOffset, 0)

  const reportHeights = useCallback((children: HTMLCollection) => {
    const results: ItemHeight[] = []
    for (var i = 0, len = children.length; i < len; i++) {
      let child = children.item(i) as HTMLElement
      if (!child || child.tagName !== 'DIV') {
        continue
      }

      const index = parseInt(child.dataset.index!)
      const size = child.offsetHeight
      if (results.length === 0 || results[results.length - 1].size !== size) {
        results.push({ start: index, end: index, size })
      } else {
        results[results.length - 1].end++
      }
    }

    if (results.length > 0) {
      itemHeights(results)
    }
  }, [])

  const listCallbackRef = useHeight(
    listHeight,
    () => {},
    ref => {
      if (!fixedItemHeight) {
        reportHeights(ref!.children)
      }
    }
  )

  const viewportCallbackRef = useHeight(viewportHeight, ref => {
    if (ref!.style.position === '') {
      ref!.style.position = '-webkit-sticky'
    }
  })

  const transform = `translateY(${translate}px)`
  const topTransform = `translateY(${-translate}px)`

  return (
    <VirtuosoScroller style={style} ScrollContainer={ScrollContainer} className={className}>
      <div style={viewportStyle} ref={viewportCallbackRef}>
        <div style={{ transform }}>
          <div ref={listCallbackRef}>
            <VirtuosoList list={topList} transform={topTransform} render={item} />
            <VirtuosoList list={list} render={item} />
            {footer && <VirtuosoFooter footer={footer} />}
          </div>
        </div>
      </div>

      <VirtuosoFiller />
    </VirtuosoScroller>
  )
}

export { TScrollContainer }
