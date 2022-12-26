import * as u from './urx'

export const recalcSystem = u.system(
  () => {
    const recalcInProgress = u.statefulStream(false)
    return { recalcInProgress }
  },
  [],
  { singleton: true }
)
