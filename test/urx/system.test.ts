import { system, init, statefulStream, tup } from '../../src/urx'
import { describe, it, expect } from 'vitest'

describe('system', () => {
  it('run executes the factory', () => {
    const a = statefulStream(0)

    const eng = system(() => {
      return { a }
    })

    const sys = init(eng)
    expect(sys).toMatchObject({ a })
  })

  it('run initiates the dependencies', () => {
    const a = statefulStream(0)
    const b = statefulStream(0)

    const eng = system(() => {
      return { a }
    })

    const eng2 = system(([{ a }]) => {
      return { b, a }
    }, tup(eng))

    expect(init(eng2)).toMatchObject({ a, b })
  })

  it('singleton instantiates the system only once', () => {
    const system1 = system(
      () => {
        const a = statefulStream(0)
        return { a }
      },
      [],
      { singleton: true }
    )

    const system2 = system(([{ a }]) => {
      const b = statefulStream(0)
      return { b, a }
    }, tup(system1))

    const system3 = system(([{ a }]) => {
      const c = statefulStream(0)
      return { c, a }
    }, tup(system1))

    const system4 = system(([{ a: a1, b }, { a: a2, c }]) => {
      expect(a1).toBe(a2)
      return { b, c }
    }, tup(system2, system3))

    init(system4)
  })
})
