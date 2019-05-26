import React, { useContext, ReactElement, HTMLAttributes } from 'react'
import { useOutput } from './Utils'
import { VirtuosoState } from './Virtuoso'
import { VirtuosoContext } from './VirtuosoContext'
import { ListItem } from './GroupIndexTransposer'

export type TRenderProps = HTMLAttributes<HTMLElement> & {
  key: number
  'data-index': number
  'data-known-size': number
}
export type TRender = (item: ListItem, props: TRenderProps) => ReactElement

type TListProps = Pick<VirtuosoState, 'list'> & {
  render: TRender
  pinnedClassName: string
}

const getProps = (item: ListItem, stickyItems: number[], pinnedClassName: string): TRenderProps => {
  const pinned = stickyItems.indexOf(item.index) > -1

  return {
    className: pinned ? pinnedClassName : undefined,
    key: item.index,
    'data-index': item.index,
    'data-known-size': item.size,
  }
}

export const VirtuosoList: React.FC<TListProps> = ({ list, render, pinnedClassName }) => {
  const { stickyItems: stickyItemsOutput } = useContext(VirtuosoContext)!
  const items = useOutput<ListItem[]>(list, [])
  const stickyItems = useOutput<number[]>(stickyItemsOutput, [])

  if (items.length === 0) {
    return null
  }

  return <>{items.map(item => render(item, getProps(item, stickyItems, pinnedClassName)))}</>
}
