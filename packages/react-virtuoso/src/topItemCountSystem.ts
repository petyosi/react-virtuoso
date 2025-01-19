import { listStateSystem } from './listStateSystem'
import * as u from './urx'

export const topItemCountSystem = u.system(([{ topItemsIndexes }]) => {
  const topItemCount = u.statefulStream(0)

  u.connect(
    u.pipe(
      topItemCount,
      u.filter((length) => length > 0),
      u.map((length) => Array.from({ length }).map((_, index) => index))
    ),
    topItemsIndexes
  )
  return { topItemCount }
}, u.tup(listStateSystem))
