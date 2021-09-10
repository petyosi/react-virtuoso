import * as u from '@virtuoso.dev/urx'
import { getValue, tup } from '@virtuoso.dev/urx'
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
      value && getValue(log)('props updated', {}, LogLevel.DEBUG)
    })

    return { propsReady, didMount }
  },
  tup(loggerSystem),
  { singleton: true }
)
