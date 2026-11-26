import { expectTypeOf, test } from 'vitest'

import { Mutation } from './Mutation'

import type { MutationResult } from './types'
import type { Engine, StateRef } from '@virtuoso.dev/reactive-engine-core'

test('accepts a mutationFn without a signal parameter (CX-10)', () => {
  const mutation = Mutation({
    mutationFn: (params: { id: string }) => Promise.resolve(params.id.length),
  })

  expectTypeOf(mutation.data$).toEqualTypeOf<StateRef<MutationResult<number, { id: string }>>>()
  expectTypeOf(mutation.pendingCount$).toEqualTypeOf<StateRef<number>>()
})

test('passes the signal, params, and engine to the mutation callbacks', () => {
  // Params are inferred from mutationFn; with a partially annotated mutationFn, list it before key and merge.
  // oxlint-disable-next-line sort-keys
  Mutation({
    mutationFn: (params: { id: string }, signal) => {
      expectTypeOf(signal).toEqualTypeOf<AbortSignal>()
      return Promise.resolve(params.id)
    },
    concurrency: 'coalesce',
    key: (params) => params.id,
    merge: (waiting, next) => {
      expectTypeOf(waiting).toEqualTypeOf<{ id: string }>()
      return next
    },
    onError: (_error, params, engine) => {
      expectTypeOf(params).toEqualTypeOf<{ id: string }>()
      expectTypeOf(engine).toEqualTypeOf<Engine>()
    },
    onSuccess: (data, params, engine) => {
      expectTypeOf(data).toEqualTypeOf<string>()
      expectTypeOf(params).toEqualTypeOf<{ id: string }>()
      expectTypeOf(engine).toEqualTypeOf<Engine>()
    },
  })
})

test('infers params from explicit generics regardless of option order', () => {
  Mutation<{ id: string }, string>({
    concurrency: 'switch',
    key: (params) => {
      expectTypeOf(params).toEqualTypeOf<{ id: string }>()
      return params.id
    },
    mutationFn: (params, signal) => {
      expectTypeOf(signal).toEqualTypeOf<AbortSignal>()
      return Promise.resolve(params.id)
    },
  })
})

test('includes params on pending, success, and error results only', () => {
  const inspect = (result: MutationResult<number, { id: string }>) => {
    if (result.type === 'idle') {
      // @ts-expect-error Idle results have no params.
      expectTypeOf(result.params)
    } else {
      expectTypeOf(result.params).toEqualTypeOf<{ id: string }>()
    }
  }

  expectTypeOf(inspect).toBeFunction()
})
