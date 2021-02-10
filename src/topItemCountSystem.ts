import { connect, system, map, pipe, statefulStream, tup, filter } from '@virtuoso.dev/urx'
import { listStateSystem } from './listStateSystem'

export const topItemCountSystem = system(([{ topItemsIndexes }]) => {
  const topItemCount = statefulStream(0)

  connect(
    pipe(
      topItemCount,
      filter((length) => length > 0),
      map((length) => Array.from({ length }).map((_, index) => index))
    ),
    topItemsIndexes
  )
  return { topItemCount }
}, tup(listStateSystem))
