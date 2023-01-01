import * as u from './urx'
import { loggerSystem, LogLevel } from './loggerSystem'

export const propsReadySystem = u.system(
  ([{ log }]) => {
    const propsReady = u.statefulStream(false)

    const didMount = u.streamFromEmitter(
      u.pipe(
        propsReady,
        u.filter((ready) => ready),
        u.distinctUntilChanged()
      )
    )
    u.subscribe(propsReady, (value) => {
      value && u.getValue(log)('props updated', {}, LogLevel.DEBUG)
    })

    return { propsReady, didMount }
  },
  u.tup(loggerSystem),
  { singleton: true }
)
