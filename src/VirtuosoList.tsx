import React, { useContext, ReactElement, useCallback } from 'react'
import { useOutput } from './Utils'
import { VirtuosoContext } from './VirtuosoContext'
import { ListItem } from './GroupIndexTransposer'

export interface TRenderProps {
  key: number
  'data-index': number
  'data-known-size': number
  className?: string
}
export type TRender = (item: ListItem, props: TRenderProps) => ReactElement

interface TListProps {
  render: TRender
  pinnedClassName: string
}

const getProps = (pinned: boolean, item: ListItem, pinnedClassName: string): TRenderProps => {
  return {
    className: pinned ? pinnedClassName : undefined,
    key: item.index,
    'data-index': item.index,
    'data-known-size': item.size,
  }
}

export const VirtuosoList: React.FC<TListProps> = ({ render, pinnedClassName }) => {
  const { stickyItems: stickyItemsOutput, topList, list } = useContext(VirtuosoContext)!
  const items = useOutput<ListItem[]>(list, [])
  const topItems = useOutput<ListItem[]>(topList, [])
  const stickyItems = useOutput<number[]>(stickyItemsOutput, [])

  const renderCallback = useCallback((pinned: boolean, item) => render(item, getProps(pinned, item, pinnedClassName)), [
    render,
    stickyItems,
  ])

  return (
    <>
      {topItems.map(renderCallback.bind(null, true))}
      {items.map(renderCallback.bind(null, false))}
    </>
  )
}
