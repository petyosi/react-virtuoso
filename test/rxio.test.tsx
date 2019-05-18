import { mySubject } from '../src/tinyrx'
import { makeOutput, makeInput } from '../src/rxio'

describe('rx output', () => {
  it('outputs to the given callback', () => {
    const sub = mySubject()
    const out = makeOutput(sub)

    out(val => {
      expect(val).toEqual(1)
    })
    sub.next(1)
  })

  it('overrides previous callbacks', () => {
    const sub = mySubject()
    const out = makeOutput(sub)

    let i = 0
    out(_ => {
      i++
    })
    sub.next(1)

    out(_ => {
      i++
    })
    sub.next(2)

    expect(i).toEqual(3)
  })
})

describe('rx input', () => {
  it('inputs in the given subject', () => {
    const sub = mySubject()
    sub.subscribe(val => expect(val).toEqual(1))
    const input = makeInput(sub)
    input(1)
  })
})
