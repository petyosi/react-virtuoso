import { Stream } from '@virtuoso.dev/reactive-engine-core'
import { expectTypeOf, test } from 'vitest'

import { useEngineLayoutSubscription, useEngineSubscription } from '..'

import type { Engine } from '@virtuoso.dev/reactive-engine-core'

test('infers subscription value and Engine arguments', () => {
  const event$ = Stream<{ id: string }>()

  useEngineSubscription(event$, (value, engine) => {
    expectTypeOf(value).toEqualTypeOf<{ id: string }>()
    expectTypeOf(engine).toEqualTypeOf<Engine>()
  })
  useEngineLayoutSubscription(event$, (value, engine) => {
    expectTypeOf(value).toEqualTypeOf<{ id: string }>()
    expectTypeOf(engine).toEqualTypeOf<Engine>()
  })
})

test('rejects incompatible callback values', () => {
  const event$ = Stream<number>()

  // @ts-expect-error The callback value must match the node value.
  useEngineSubscription(event$, (value: string) => value)
  // @ts-expect-error The callback value must match the node value.
  useEngineLayoutSubscription(event$, (value: string) => value)
})
