import { system, statefulStream } from '@virtuoso.dev/urx'

export const propsReadySystem = system(
  () => {
    const propsReady = statefulStream(false)
    return { propsReady }
  },
  [],
  { singleton: true }
)
