import React, { ReactElement, useContext, FC, CSSProperties } from 'react'
import { VirtuosoContext } from './VirtuosoContext'
import { useObservable, useHeight } from './Utils'
import { VirtuosoScroller } from './VirtuosoScroller'
import { VirtuosoList, VirtuosoFixedList } from './VirtuosoList'

const VirtuosoFiller: FC<{}> = () => {
  const totalHeight = useObservable(useContext(VirtuosoContext)!.totalHeight$, 0)

  return <div style={{ height: `${totalHeight}px`, position: 'absolute', top: 0 }}>&nbsp;</div>
}

const VirtuosoFooter: FC<{ footer: () => ReactElement }> = ({ footer }) => {
  const footerCallbackRef = useHeight(useContext(VirtuosoContext)!.footerHeight$)

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
  footer: (() => ReactElement) | undefined
  item: (index: number) => ReactElement
  topItemCount: number
  fixedItemHeight: boolean
}> = ({ style, footer, item, topItemCount, fixedItemHeight }) => {
  const { listHeight$, viewportHeight$, listOffset$, list$, topList$ } = useContext(VirtuosoContext)!

  const listOffset = useObservable(listOffset$, 0)
  const listCallbackRef = useHeight(listHeight$)
  const viewportCallbackRef = useHeight(viewportHeight$, ref => {
    if (ref!.style.position === '') {
      ref!.style.position = '-webkit-sticky'
    }
  })

  const transform = `translateY(${listOffset}px)`
  const topTransform = `translateY(${-listOffset}px)`

  return (
    <VirtuosoScroller style={style}>
      <div style={viewportStyle} ref={viewportCallbackRef}>
        <div style={{ transform }}>
          <div ref={listCallbackRef}>
            {topItemCount > 0 && <VirtuosoList list$={topList$} transform={topTransform} item={item} />}
            {fixedItemHeight ? (
              <VirtuosoFixedList list$={list$} item={item} />
            ) : (
              <VirtuosoList list$={list$} item={item} />
            )}

            {footer && <VirtuosoFooter footer={footer} />}
          </div>
        </div>
      </div>

      <VirtuosoFiller />
    </VirtuosoScroller>
  )
}
