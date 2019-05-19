import React, { useContext, useCallback, ReactElement, CSSProperties } from 'react'
import { useOutput } from './Utils'
import { VirtuosoState } from './Virtuoso'
import { VirtuosoContext } from './VirtuosoContext'
import { ListItem } from './GroupIndexTransposer'

export type TRender = (item: ListItem) => ReactElement

type TListProps = Pick<VirtuosoState, 'list'> & {
  render: TRender
  transform?: string
}

export const VirtuosoList: React.FC<TListProps> = ({ list, transform = '', render }) => {
  const { stickyItems: stickyItemsOutput } = useContext(VirtuosoContext)!
  const items = useOutput<ListItem[]>(list, [])
  const stickyItems = useOutput<number[]>(stickyItemsOutput, [])

  const getStyle = useCallback(
    (index): CSSProperties => {
      const pinned = stickyItems.some(stickyItemIndex => stickyItemIndex === index)

      const style: CSSProperties = {
        transform,
        zIndex: pinned ? 2 : undefined,
        position: pinned ? 'relative' : undefined,
      }

      return style
    },
    [stickyItems, transform]
  )

  if (items.length === 0) {
    return null
  }

  return (
    <>
      {items.map(item => {
        return (
          <div key={item.index} data-index={item.index} data-known-size={item.size} style={getStyle(item.index)}>
            {render(item)}
          </div>
        )
      })}
    </>
  )
}
