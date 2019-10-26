import { subject } from '../src/tinyrx'
import { makeOutput, makeInput } from '../src/rxio'

describe('rx output', () => {
  it('outputs to the given callback', () => {
    const sub = subject()
    const out = makeOutput(sub)

    out(val => {
      expect(val).toEqual(1)
    })
    sub.next(1)
  })

  it('overrides previous callbacks', () => {
    const sub = subject<number>()
    const out = makeOutput(sub)

    const results: number[] = []
    out(val => results.push(val))
    sub.next(1)

    out(val => results.push(val * 2)) // this should remove the previous callback
    sub.next(2)

    expect(results).toEqual([1, 2, 4])
  })
})

describe('rx input', () => {
  it('inputs in the given subject', () => {
    const sub = subject()
    sub.subscribe(val => expect(val).toEqual(1))
    const input = makeInput(sub)
    input(1)
  })
})
