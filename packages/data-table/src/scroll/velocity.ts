import { Cell, e } from '@virtuoso.dev/reactive-engine-core'

import { isFalse } from '../utils'
import { isScrolling$ } from './at-bottom'
import { scrollTop$ } from './dom'

export const scrollVelocity$ = Cell(0)
e.link(e.pipe(isScrolling$, e.filter(isFalse), e.mapTo(0)), scrollVelocity$)

e.link(
  e.pipe(
    scrollTop$,
    e.throttleTime(100),
    e.withLatestFrom(isScrolling$),
    e.filter(([, isScrolling]) => Boolean(isScrolling)),
    e.scan(([, prev], [next]) => [prev, next] as [number, number], [0, 0] as [number, number]),
    e.map(([prev, next]) => next - prev)
  ),
  scrollVelocity$
)
