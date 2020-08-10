import React, { useContext, ReactElement, CSSProperties, ReactNode } from 'react'
import { useOutput, positionStickyCssValue } from './Utils'
import { VirtuosoContext } from './VirtuosoContext'
import { ListItem } from './GroupIndexTransposer'

export interface TRenderProps {
  key: React.Key
  'data-index': number
  'data-known-size': number
  renderPlaceholder: boolean
  style?: CSSProperties
}
export type TRender = (item: ListItem, props: TRenderProps) => ReactElement

export interface VirtuosoListProps {
  emptyComponent?: React.ReactNode
}

export const VirtuosoList: React.FC<VirtuosoListProps> = React.memo(({ emptyComponent }) => {
  const { isSeeking, topList, list, itemRender } = useContext(VirtuosoContext)!
  const items = useOutput<ListItem[]>(list, [])
  const topItems = useOutput<ListItem[]>(topList, [])
  const render = useOutput(itemRender, false as any)
  const renderPlaceholder = useOutput(isSeeking, false)

  const renderedItems: ReactNode[] = []
  let topOffset = 0
  const renderedTopItemIndices: number[] = []

  const marginTop = topItems.reduce((acc, item) => {
    return acc + item.size
  }, 0)

  topItems.forEach((item, index) => {
    const itemIndex = item.index
    renderedTopItemIndices.push(itemIndex)

    const style: CSSProperties = {
      top: `${topOffset}px`,
      marginTop: index === 0 ? `${-marginTop}px` : undefined,
      zIndex: 2,
      position: positionStickyCssValue(),
    }

    const props = {
      key: itemIndex,
      'data-index': itemIndex,
      'data-known-size': item.size,
      renderPlaceholder,
      style,
    }

    render && renderedItems.push(render.render(item, props))
    topOffset += item.size
  })

  items.forEach(item => {
    if (renderedTopItemIndices.indexOf(item.index) > -1) {
      return
    }

    render &&
      renderedItems.push(
        render.render(item, {
          key: item.index,
          'data-index': item.index,
          'data-known-size': item.size,
          renderPlaceholder,
        })
      )
  })

  if (renderedItems.length === 0) return <>{emptyComponent}</>
  return <>{renderedItems}</>
})
