import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { expectTypeOf, test } from 'vitest'

import { Mutation } from './Mutation'

import type { KeyedMutation, UnkeyedMutation } from './Mutation'
import type { MutationActiveResult, MutationResult, MutationSettled, UnkeyedMutationOptions } from './types'
import type { NodeRef, StateRef } from '@virtuoso.dev/reactive-engine-core'

interface Task {
  id: number
  title: string
}

const save = (task: Task) => Promise.resolve(task.title)

test('key: false returns data$ and dismiss$: Stream<void>, and no status$', () => {
  const mutation = Mutation<Task, string>({ key: false, mutationFn: save })

  expectTypeOf(mutation.data$).toEqualTypeOf<StateRef<MutationResult<string, Task>>>()
  expectTypeOf(mutation.dismiss$).toEqualTypeOf<NodeRef<void>>()
  expectTypeOf(mutation.settled$).toEqualTypeOf<NodeRef<MutationSettled<string, Task>>>()
  // @ts-expect-error A mutation with key: false has no status$.
  expectTypeOf(mutation.status$)
})

test('a key function returns status$, dismiss$: Stream<TKey>, and dismissAll$', () => {
  const mutation = Mutation<Task, string, number>({ key: (task) => task.id, mutationFn: save })

  expectTypeOf(mutation.status$).toEqualTypeOf<StateRef<ReadonlyMap<number, MutationActiveResult<string, Task, number>>>>()
  expectTypeOf(mutation.dismiss$).toEqualTypeOf<NodeRef<number>>()
  expectTypeOf(mutation.dismissAll$).toEqualTypeOf<NodeRef<void>>()
  expectTypeOf<MutationSettled<string, Task, number>['key']>().toEqualTypeOf<number>()
  // @ts-expect-error A keyed mutation has no data$.
  expectTypeOf(mutation.data$)

  const engine = new Engine()
  // @ts-expect-error The key type is number, so a string does not dismiss anything.
  engine.pub(mutation.dismiss$, '12')
  // @ts-expect-error The key type is number, so a string lookup is a compile error.
  engine.getValue(mutation.status$).get('12')
})

test('explicit type arguments without the key type reject a key function', () => {
  // @ts-expect-error TKey defaults to never: add the key type as the third type argument.
  Mutation<Task, string>({ key: (task) => task.id, mutationFn: save })
})

test('inference: with an annotated mutationFn parameter, a number key is inferred', () => {
  const mutation = Mutation({ key: (task) => task.id, mutationFn: (task: Task) => Promise.resolve(task.title) })

  expectTypeOf(mutation).toEqualTypeOf<KeyedMutation<Task, string, number>>()
})

test('options declared separately need key: false as const', () => {
  const options = { key: false as const, mutationFn: save }
  expectTypeOf(Mutation(options)).toEqualTypeOf<UnkeyedMutation<Task, string>>()

  const typed: UnkeyedMutationOptions<Task, string> = { key: false, mutationFn: save }
  expectTypeOf(Mutation(typed)).toEqualTypeOf<UnkeyedMutation<Task, string>>()
})

test('union options select the union overload', () => {
  const perRow = Math.random() > 0.5
  const mutation = Mutation<Task, string, number>(perRow ? { key: (task) => task.id, mutationFn: save } : { key: false, mutationFn: save })

  expectTypeOf(mutation).toEqualTypeOf<KeyedMutation<Task, string, number> | UnkeyedMutation<Task, string>>()
  if ('status$' in mutation) {
    expectTypeOf(mutation.status$).toEqualTypeOf<StateRef<ReadonlyMap<number, MutationActiveResult<string, Task, number>>>>()
  }
})

test('invalid options are compile errors', () => {
  // @ts-expect-error key is required.
  Mutation<Task, string>({ mutationFn: save })
  // @ts-expect-error key: true is not a choice.
  Mutation<Task, string>({ key: true, mutationFn: save })
  // @ts-expect-error A key must be a string or a number, not an object.
  Mutation({ key: (task: Task) => ({ id: task.id }), mutationFn: save })
  // @ts-expect-error A key must be a string or a number, not a tuple.
  Mutation({ key: (task: Task) => [task.id, task.title], mutationFn: save })
  // @ts-expect-error A key must not be undefined.
  Mutation({ key: (task: Task) => (task.id > 0 ? 'x' : undefined), mutationFn: save })
})

test('callbacks receive data or error, params, and the engine', () => {
  Mutation<Task, string, number>({
    key: (task) => task.id,
    mutationFn: save,
    onError: (error, params, engine) => {
      expectTypeOf(error).toEqualTypeOf<unknown>()
      expectTypeOf(params).toEqualTypeOf<Task>()
      expectTypeOf(engine).toEqualTypeOf<Engine>()
    },
    onIgnored: (params) => {
      expectTypeOf(params).toEqualTypeOf<Task>()
    },
    onSuccess: (data, params) => {
      expectTypeOf(data).toEqualTypeOf<string>()
      expectTypeOf(params).toEqualTypeOf<Task>()
    },
  })
})
