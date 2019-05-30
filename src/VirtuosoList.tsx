import React, { useContext, ReactElement, CSSProperties, ReactNode } from 'react'
import { useOutput } from './Utils'
import { VirtuosoContext } from './VirtuosoContext'
import { ListItem } from './GroupIndexTransposer'

export interface TRenderProps {
  key: number
  'data-index': number
  'data-known-size': number
  style?: CSSProperties
}
export type TRender = (item: ListItem, props: TRenderProps) => ReactElement

interface TListProps {
  render: TRender
  stickyClassName: string
}

export const VirtuosoList: React.FC<TListProps> = ({ render, stickyClassName }) => {
  const { topList, list } = useContext(VirtuosoContext)!
  const items = useOutput<ListItem[]>(list, [])
  const topItems = useOutput<ListItem[]>(topList, [])

  let renderedItems: ReactNode[] = []
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
    }

    const props = {
      key: itemIndex,
      'data-index': itemIndex,
      'data-known-size': item.size,
      className: stickyClassName,
      style,
    }
    renderedItems.push(render(item, props))
    topOffset += item.size
  })

  items.forEach(item => {
    if (renderedTopItemIndices.indexOf(item.index) > -1) {
      return
    }

    renderedItems.push(render(item, { key: item.index, 'data-index': item.index, 'data-known-size': item.size }))
  })

  return <> {renderedItems} </>
}
