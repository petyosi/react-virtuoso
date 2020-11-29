import * as u from '@virtuoso.dev/urx'

export const propsReadySystem = u.system(
  () => {
    const propsReady = u.statefulStream(false)

    const didMount = u.streamFromEmitter(
      u.pipe(
        propsReady,
        u.filter(ready => ready),
        u.distinctUntilChanged()
      )
    )

    return { propsReady, didMount }
  },
  [],
  { singleton: true }
)
