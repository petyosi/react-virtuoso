import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { expectTypeOf, test } from 'vitest'

import { ConcurrentMutation } from './ConcurrentMutation'

import type { KeyedConcurrentMutation, UnkeyedConcurrentMutation } from './ConcurrentMutation'
import type { ConcurrentMutationSettled, ConcurrentMutationState } from './types'
import type { NodeRef, StateRef } from '@virtuoso.dev/reactive-engine-core'

interface Task {
  done: boolean
  id: number
}

const save = (task: Task) => Promise.resolve(task)

test('key: false returns data$, dismiss$: Stream<void>, and dropWaiting$: Stream<void>, and no status$', () => {
  const mutation = ConcurrentMutation<Task, Task>({ concurrency: 'serial', key: false, mutationFn: save })

  expectTypeOf(mutation).toEqualTypeOf<UnkeyedConcurrentMutation<Task, Task>>()
  expectTypeOf(mutation.data$).toEqualTypeOf<StateRef<ConcurrentMutationState<Task, Task>>>()
  expectTypeOf(mutation.dismiss$).toEqualTypeOf<NodeRef<void>>()
  expectTypeOf(mutation.dropWaiting$).toEqualTypeOf<NodeRef<void>>()
  expectTypeOf(mutation.settled$).toEqualTypeOf<NodeRef<ConcurrentMutationSettled<Task, Task>>>()
  // @ts-expect-error A ConcurrentMutation with key: false has no status$.
  expectTypeOf(mutation.status$)
  // @ts-expect-error A ConcurrentMutation with key: false has no dropWaitingAll$.
  expectTypeOf(mutation.dropWaitingAll$)
})

test('a key function returns status$ and keyed commands', () => {
  const mutation = ConcurrentMutation<Task, Task, number>({ concurrency: 'coalesce', key: (task) => task.id, mutationFn: save })

  expectTypeOf(mutation).toEqualTypeOf<KeyedConcurrentMutation<Task, Task, number>>()
  expectTypeOf(mutation.status$).toEqualTypeOf<StateRef<ReadonlyMap<number, ConcurrentMutationState<Task, Task, number>>>>()
  expectTypeOf(mutation.dismiss$).toEqualTypeOf<NodeRef<number>>()
  expectTypeOf(mutation.dismissAll$).toEqualTypeOf<NodeRef<void>>()
  expectTypeOf(mutation.dropWaiting$).toEqualTypeOf<NodeRef<number>>()
  expectTypeOf(mutation.dropWaitingAll$).toEqualTypeOf<NodeRef<void>>()
  expectTypeOf<ConcurrentMutationState<Task, Task, number>['key']>().toEqualTypeOf<number>()
  // @ts-expect-error A keyed ConcurrentMutation has no data$.
  expectTypeOf(mutation.data$)

  const engine = new Engine()
  // @ts-expect-error The key type is number.
  engine.pub(mutation.dropWaiting$, '1')
})

test('union options select the union overload', () => {
  const perRow = Math.random() > 0.5
  const mutation = ConcurrentMutation<Task, Task, number>(
    perRow ? { concurrency: 'serial', key: (task) => task.id, mutationFn: save } : { concurrency: 'serial', key: false, mutationFn: save }
  )

  expectTypeOf(mutation).toEqualTypeOf<KeyedConcurrentMutation<Task, Task, number> | UnkeyedConcurrentMutation<Task, Task>>()
})

test('merge is typed with the params, and options a policy would ignore are errors', () => {
  ConcurrentMutation<Task, Task, number>({
    concurrency: 'coalesce',
    key: (task) => task.id,
    merge: (waiting, next) => {
      expectTypeOf(waiting).toEqualTypeOf<Task>()
      return next
    },
    mutationFn: save,
  })

  // @ts-expect-error merge is only allowed with coalesce.
  ConcurrentMutation<Task, Task, number>({
    concurrency: 'serial',
    key: (task) => task.id,
    merge: (_w: Task, n: Task) => n,
    mutationFn: save,
  })
  // @ts-expect-error concurrency is required.
  ConcurrentMutation<Task, Task>({ key: false, mutationFn: save })
  // @ts-expect-error There is no switch policy.
  ConcurrentMutation<Task, Task>({ concurrency: 'switch', key: false, mutationFn: save })
  // @ts-expect-error TKey defaults to never: add the key type.
  ConcurrentMutation<Task, Task>({ concurrency: 'parallel', key: (task) => task.id, mutationFn: save })
  // @ts-expect-error key is required.
  ConcurrentMutation<Task, Task>({ concurrency: 'parallel', mutationFn: save })
})
