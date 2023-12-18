import * as u from '@virtuoso.dev/urx'

export const recalcSystem = u.system(
  () => {
    const recalcInProgress = u.statefulStream(false)
    return { recalcInProgress }
  },
  [],
  { singleton: true }
)
