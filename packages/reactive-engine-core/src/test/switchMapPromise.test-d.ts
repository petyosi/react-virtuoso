import { expectTypeOf, test } from 'vitest'

import { e, Stream } from '..'

import type { NodeRef, SwitchMapPromiseResult } from '..'

test('infers input and Promise value in the discriminated result union', () => {
  const source$ = Stream<{ id: string }>()
  const result$ = e.pipe(
    source$,
    e.switchMapPromise((input, signal) => {
      expectTypeOf(input).toEqualTypeOf<{ id: string }>()
      expectTypeOf(signal).toEqualTypeOf<AbortSignal>()
      return Promise.resolve(input.id.length)
    })
  )

  expectTypeOf(result$).toEqualTypeOf<NodeRef<SwitchMapPromiseResult<{ id: string }, number>>>()
})

test('narrows success and error results while retaining the input', () => {
  const inspect = (result: SwitchMapPromiseResult<string, number>) => {
    expectTypeOf(result.input).toEqualTypeOf<string>()
    if (result.status === 'success') {
      expectTypeOf(result.value).toEqualTypeOf<number>()
      // @ts-expect-error Success results do not contain error.
      expectTypeOf(result.error)
    } else {
      expectTypeOf(result.error).toEqualTypeOf<unknown>()
      // @ts-expect-error Error results do not contain value.
      expectTypeOf(result.value)
    }
  }

  expectTypeOf(inspect).toBeFunction()
})

test('rejects a non-Promise projector', () => {
  const invalid = () =>
    e.switchMapPromise(
      // @ts-expect-error The projector must return a Promise.
      (input: number) => input * 2
    )

  expectTypeOf(invalid).toBeFunction()
})
