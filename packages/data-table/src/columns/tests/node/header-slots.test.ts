import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  headerSlotEndEntries$,
  headerSlotEndRegister$,
  headerSlotStartEntries$,
  headerSlotStartRegister$,
} from '../../header-slots/registry'

describe('header slot registries', () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(headerSlotStartEntries$)
    engine.register(headerSlotEndEntries$)
  })

  it('registers start slot entries by id', () => {
    engine.pub(headerSlotStartRegister$, {
      type: 'add',
      id: 'slot-1',
      value: { columnId: 'column-1', type: 'function', renderer: () => null },
    })

    expect(engine.getValue(headerSlotStartEntries$).get('slot-1')?.columnId).toBe('column-1')
  })

  it('unregisters slot entries on remove', () => {
    engine.pub(headerSlotStartRegister$, {
      type: 'add',
      id: 'slot-1',
      value: { columnId: 'column-1', type: 'function', renderer: () => null },
    })

    engine.pub(headerSlotStartRegister$, { type: 'remove', id: 'slot-1' })

    expect(engine.getValue(headerSlotStartEntries$).size).toBe(0)
  })

  it('keeps each position independent', () => {
    engine.pub(headerSlotStartRegister$, {
      type: 'add',
      id: 'start-1',
      value: { columnId: 'column-1', type: 'function', renderer: () => null },
    })
    engine.pub(headerSlotEndRegister$, {
      type: 'add',
      id: 'end-1',
      value: { columnId: 'column-2', type: 'function', renderer: () => null },
    })

    expect([...engine.getValue(headerSlotStartEntries$).values()].map((entry) => entry.columnId)).toStrictEqual(['column-1'])
    expect([...engine.getValue(headerSlotEndEntries$).values()].map((entry) => entry.columnId)).toStrictEqual(['column-2'])
  })

  it('preserves registration order within a slot position', () => {
    engine.pub(headerSlotStartRegister$, {
      type: 'add',
      id: 'start-1',
      value: { columnId: 'column-1', type: 'function', renderer: () => null },
    })
    engine.pub(headerSlotStartRegister$, {
      type: 'add',
      id: 'start-2',
      value: { columnId: 'column-1', type: 'function', renderer: () => null },
    })

    expect([...engine.getValue(headerSlotStartEntries$).keys()]).toStrictEqual(['start-1', 'start-2'])
  })
})
