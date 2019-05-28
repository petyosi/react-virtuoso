import React, { useContext, ReactElement, useCallback, CSSProperties } from 'react'
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
}

const getProps = (pinned: boolean, item: ListItem, translate: number): TRenderProps => {
  return {
    key: item.index,
    'data-index': item.index,
    'data-known-size': item.size,
    style: pinned ? { transform: `translateY(${translate}px)`, position: 'relative', zIndex: 2 } : undefined,
  }
}

export const VirtuosoList: React.FC<TListProps> = ({ render }) => {
  const { stickyItems: stickyItemsOutput, topList, list, stickyItemsOffset } = useContext(VirtuosoContext)!
  const items = useOutput<ListItem[]>(list, [])
  const topItems = useOutput<ListItem[]>(topList, [])
  const stickyItems = useOutput<number[]>(stickyItemsOutput, [])
  const translate = useOutput(stickyItemsOffset, 0)

  const renderCallback = useCallback(
    (pinned: boolean, translate: number, item) => render(item, getProps(pinned, item, translate)),
    [render, stickyItems]
  )

  return (
    <>
      {topItems.map(renderCallback.bind(null, true, translate))}
      {items.map(renderCallback.bind(null, false, translate))}
    </>
  )
}
