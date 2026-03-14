import { e } from '@virtuoso.dev/reactive-engine-core'

import { rowsState$ } from '../rows/row-state'
import { scrollBy$ } from './dom'
import { deviationDelta$ } from './state'

export { deviationDelta$, mobileSafariIsReadjusting$, suppressUpwardsFix$ } from './state'

e.link(
  e.pipe(
    rowsState$,
    e.map((state) => state.deviationDelta),
    e.filter((delta) => delta !== 0)
  ),
  deviationDelta$
)

e.link(deviationDelta$, scrollBy$)
