import { expectTypeOf, test } from 'vitest'

import { Mutation } from './Mutation'

import type { MutationConcurrency, MutationResult, MutationSettled } from './index'
import type { Engine, NodeRef, StateRef } from '@virtuoso.dev/reactive-engine-core'

test('accepts a mutationFn without a signal parameter', () => {
  const mutation = Mutation({
    mutationFn: (params: { id: string }) => Promise.resolve(params.id.length),
  })

  expectTypeOf(mutation.data$).toEqualTypeOf<StateRef<MutationResult<number, { id: string }>>>()
  expectTypeOf(mutation.pendingCount$).toEqualTypeOf<StateRef<number>>()
  expectTypeOf(mutation.settled$).toEqualTypeOf<NodeRef<MutationSettled<number, { id: string }>>>()
  expectTypeOf(mutation.reset$).toEqualTypeOf<NodeRef<void>>()
  expectTypeOf(mutation.dropWaiting$).toEqualTypeOf<NodeRef<void>>()
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
    concurrency: 'serial',
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

test('rejects options that the chosen policy would ignore', () => {
  const mutationFn = (params: { id: string }) => Promise.resolve(params.id)

  // @ts-expect-error Parallel calls never wait, so a key has no effect.
  Mutation({ key: (params: { id: string }) => params.id, mutationFn })
  // @ts-expect-error Only coalesce merges waiting params.
  Mutation({ concurrency: 'serial', merge: (_waiting: { id: string }, next: { id: string }) => next, mutationFn })
  // @ts-expect-error A started call is never aborted, so there is no switch policy.
  Mutation({ concurrency: 'switch', mutationFn })

  expectTypeOf<MutationConcurrency>().toEqualTypeOf<'coalesce' | 'parallel' | 'serial'>()
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

test('narrows settled outcomes by type', () => {
  const inspect = (outcome: MutationSettled<number, { id: string }>) => {
    expectTypeOf(outcome.params).toEqualTypeOf<{ id: string }>()
    if (outcome.type === 'success') {
      expectTypeOf(outcome.data).toEqualTypeOf<number>()
    } else if (outcome.type === 'error') {
      expectTypeOf(outcome.error).toEqualTypeOf<unknown>()
    } else {
      expectTypeOf(outcome.type).toEqualTypeOf<'dropped'>()
    }
  }

  expectTypeOf(inspect).toBeFunction()
})
