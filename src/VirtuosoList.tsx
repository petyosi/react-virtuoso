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
}

export const VirtuosoList: React.FC<TListProps> = ({ render }) => {
  const { topList, list } = useContext(VirtuosoContext)!
  const items = useOutput<ListItem[]>(list, [])
  const topItems = useOutput<ListItem[]>(topList, [])
  // const stickyItems = useOutput<number[]>(stickyItemsOutput, [])
  // const translate = useOutput(stickyItemsOffset, 0)

  let renderedItems: ReactNode[] = []
  let topOffset = 0
  const marginTop = topItems.reduce((acc, item) => {
    return acc + item.size
  }, 0)

  topItems.forEach((item, index) => {
    const style: CSSProperties = { position: 'sticky', top: `${topOffset}px`, zIndex: 2 }
    if (index === 0) {
      style.marginTop = `${-marginTop}px`
    }
    const props = {
      key: item.index,
      'data-index': item.index,
      'data-known-size': item.size,
      style,
    }
    renderedItems.push(render(item, props))
    topOffset += item.size
  })

  console.log(items, topItems)

  renderedItems = renderedItems.concat(
    items.map(item => {
      return render(item, { key: item.index, 'data-index': item.index, 'data-known-size': item.size })
    })
  )
  console.log(renderedItems)

  return <> {renderedItems} </>
}
