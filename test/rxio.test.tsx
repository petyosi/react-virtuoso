import { Subject } from 'rxjs'
import { makeOutput, makeInput } from '../src/rxio'

describe('rx output', () => {
  it('outputs to the given callback', () => {
    const sub = new Subject<number>()
    const out = makeOutput(sub)

    out(val => {
      expect(val).toEqual(1)
    })
    sub.next(1)
  })

  it('overrides previous callbacks', () => {
    const sub = new Subject<number>()
    const out = makeOutput(sub)

    out(val => {
      expect(val).toEqual(1)
    })
    sub.next(1)

    out(val => {
      expect(val).toEqual(2)
    })
    sub.next(2)
  })
})

describe('rx input', () => {
  it('inputs in the given subject', () => {
    const sub = new Subject<number>()
    sub.subscribe(val => expect(val).toEqual(1))
    const input = makeInput(sub)
    input(1)
  })
})
