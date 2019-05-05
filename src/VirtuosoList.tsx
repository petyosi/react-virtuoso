import React, { useContext, useCallback, ReactElement } from 'react'
import { CallbackRefParam, useObservable } from './Utils'
import { VirtuosoState } from './Virtuoso'
import { VirtuosoContext } from './VirtuosoContext'
import { Item } from './OffsetList'

type ListObservables = Pick<VirtuosoState, 'list$'> & {
  transform?: string
  item: (index: number) => ReactElement
}

export const VirtuosoList: React.FC<ListObservables> = ({ list$, transform = '', item: itemRenderProp }) => {
  const { itemHeights$ } = useContext(VirtuosoContext)!

  const items = useObservable<Item[]>(list$, [])

  const itemCallbackRef = useCallback(
    (index: number, knownSize: number, ref: CallbackRefParam) => {
      if (ref) {
        let size = ref.offsetHeight

        if (size !== knownSize) {
          itemHeights$.next({ index, size })
        }
      }
    },
    [itemHeights$]
  )

  return (
    <>
      {items.map(item => {
        return (
          <div
            key={item.index}
            ref={itemCallbackRef.bind(null, item.index, item.size)}
            style={{
              transform,
              zIndex: transform ? 2 : undefined,
              position: transform ? 'relative' : undefined,
            }}
          >
            {itemRenderProp(item.index)}
          </div>
        )
      })}
    </>
  )
}
