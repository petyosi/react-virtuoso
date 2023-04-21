import { domIOSystem } from './domIOSystem'
import { initialTopMostItemIndexSystem } from './initialTopMostItemIndexSystem'
import { StateSnapshot, StateCallback } from './interfaces'
import { sizeSystem, sizeTreeToRanges } from './sizeSystem'
import * as u from './urx'

export const stateLoadSystem = u.system(([{ sizes, sizeRanges }, { scrollTop }, { initialTopMostItemIndex }]) => {
  const getState = u.stream<StateCallback>()
  const restoreStateFrom = u.statefulStream<StateSnapshot | undefined>(undefined)

  u.subscribe(u.pipe(getState, u.withLatestFrom(sizes, scrollTop)), ([callback, sizes, scrollTop]) => {
    const ranges = sizeTreeToRanges(sizes.sizeTree)
    callback({ ranges, scrollTop })
  })

  u.connect(u.pipe(restoreStateFrom, u.filter(u.isDefined), u.map(locationFromSnapshot)), initialTopMostItemIndex)

  u.connect(
    u.pipe(
      restoreStateFrom,
      u.filter(u.isDefined),
      u.map((snapshot) => snapshot!.ranges)
    ),
    sizeRanges
  )

  return {
    getState,
    restoreStateFrom,
  }
}, u.tup(sizeSystem, domIOSystem, initialTopMostItemIndexSystem))

function locationFromSnapshot(snapshot: StateSnapshot | undefined) {
  return { offset: snapshot!.scrollTop, index: 0, align: 'start' }
}
