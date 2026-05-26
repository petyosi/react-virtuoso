// oxlint-disable require-hook
import { Cell, Stream, e } from '@virtuoso.dev/reactive-engine-core'

type RegistryPayload<V> = { type: 'add'; id: string; value: V } | { type: 'remove'; id: string }

export function createRegistryCell<V>() {
  const cell$ = Cell(new Map<string, V>())
  const register$ = Stream<RegistryPayload<V>>()

  e.changeWith(cell$, register$, (current, payload) => {
    const next = new Map(current)
    if (payload.type === 'add') {
      next.set(payload.id, payload.value)
    } else {
      next.delete(payload.id)
    }
    return next
  })

  return { cell$, register$ }
}
