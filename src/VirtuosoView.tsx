import React, { ReactElement, useContext, FC, CSSProperties } from 'react'
import { VirtuosoContext } from './VirtuosoContext'
import { useObservable, useHeight } from './Utils'
import { VirtuosoScroller } from './VirtuosoScroller'
import { VirtuosoList, TRender } from './VirtuosoList'

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
  item: TRender
  fixedItemHeight: boolean
}> = ({ style, footer, item, fixedItemHeight }) => {
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
            <VirtuosoList list$={topList$} transform={topTransform} render={item} fixedItemHeight={fixedItemHeight} />
            <VirtuosoList list$={list$} render={item} fixedItemHeight={fixedItemHeight} />
            {footer && <VirtuosoFooter footer={footer} />}
          </div>
        </div>
      </div>

      <VirtuosoFiller />
    </VirtuosoScroller>
  )
}
