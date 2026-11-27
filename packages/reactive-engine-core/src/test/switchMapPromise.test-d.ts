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

test('keyed and coalescing operators share the switchMapPromise result type (CX-10)', () => {
  const source$ = Stream<{ id: string; patch: { a?: number } }>()
  const coalesced$ = e.pipe(
    source$,
    e.coalescePromise((input) => Promise.resolve(input.id.length), {
      key: (input) => input.id,
      merge: (waiting, next) => {
        expectTypeOf(waiting).toEqualTypeOf<{ id: string; patch: { a?: number } }>()
        return { ...next, patch: { ...waiting.patch, ...next.patch } }
      },
    })
  )
  const concatenated$ = e.pipe(
    source$,
    e.concatMapPromise((input) => Promise.resolve(input.id), { key: (input) => input.id })
  )
  const switched$ = e.pipe(
    source$,
    e.switchMapPromise((input) => Promise.resolve(input.id), { key: (input) => input.id })
  )

  expectTypeOf(coalesced$).toEqualTypeOf<NodeRef<SwitchMapPromiseResult<{ id: string; patch: { a?: number } }, number>>>()
  expectTypeOf(concatenated$).toEqualTypeOf<NodeRef<SwitchMapPromiseResult<{ id: string; patch: { a?: number } }, string>>>()
  expectTypeOf(switched$).toEqualTypeOf<NodeRef<SwitchMapPromiseResult<{ id: string; patch: { a?: number } }, string>>>()
})

test('merge is only accepted by coalescePromise', () => {
  const invalid = () =>
    e.concatMapPromise((input: number) => Promise.resolve(input), {
      // @ts-expect-error concatMapPromise runs every input, so it has no merge option.
      merge: (_waiting: number, next: number) => next,
    })

  expectTypeOf(invalid).toBeFunction()
})
