import { connect, filter, getValue, handleNext, map, pipe, publish, scan, subscribe, system, tup, withLatestFrom } from '@virtuoso.dev/urx'
import { UP, domIOSystem } from './domIOSystem'
import { ListItem, listStateSystem } from './listStateSystem'
import { offsetOf, sizeSystem } from './sizeSystem'

/**
 * Fixes upward scrolling by calculating and compensation from changed item heights, using scrollBy.
 */
export const upwardScrollFixSystem = system(
  ([{ scrollBy, scrollTop, scrollDirection }, { listState }, { unshiftWith, sizes, listRefresh }]) => {
    connect(
      pipe(
        listState,
        withLatestFrom(scrollTop, scrollDirection),
        filter(([, scrollTop, scrollDirection]) => {
          return scrollTop !== 0 && scrollDirection === UP
        }),
        map(([state]) => state),
        scan(
          ([, prevItems], { items }) => {
            let newDev = 0
            if (prevItems.length > 0 && items.length > 0) {
              const atStart = prevItems[0].originalIndex === 0 && items[0].originalIndex === 0

              if (!atStart) {
                for (let index = items.length - 1; index >= 0; index--) {
                  const item = items[index]

                  const prevItem = prevItems.find(pItem => pItem.originalIndex === item.originalIndex)

                  if (!prevItem) {
                    continue
                  }

                  if (item.offset !== prevItem.offset) {
                    newDev = item.offset - prevItem.offset
                    break
                  }
                }
              }
            }

            return [newDev, items] as [number, ListItem[]]
          },
          [0, []] as [number, ListItem[]]
        ),
        filter(([deviation]) => deviation !== 0),
        map(([deviation]) => {
          return {
            top: deviation,
            behavior: 'auto',
          }
        })
      ),
      scrollBy
    )

    subscribe(
      pipe(
        unshiftWith,
        withLatestFrom(sizes, listState),
        map(([unshiftWith, sizeState, listState]) => {
          return {
            index: listState.items[0].index + unshiftWith,
            offset: offsetOf(listState.items[0].index, sizeState),
          }
        })
      ),
      ({ index, offset }) => {
        handleNext(listRefresh, () => {
          const newOffset = offsetOf(index, getValue(sizes))
          publish(scrollBy, { top: newOffset - offset })
        })
      }
    )

    return {}
  },
  tup(domIOSystem, listStateSystem, sizeSystem)
)
