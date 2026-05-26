import { Cell, Stream } from '@virtuoso.dev/reactive-engine-core'

import type { DispatchModelActionPayload, ModelActionSnapshot, ModelActionState } from '../model/action-state'

/**
 * Remote command stream for dispatching a data model action through the table engine.
 *
 * @group Remote Control
 */
export const dispatchModelAction$ = Stream<DispatchModelActionPayload>()

/**
 * Current stateful data model action payloads exposed through the table engine.
 *
 * @group Remote Control
 */
export const modelActionState$ = Cell<ModelActionState>({})

export type { DispatchModelActionPayload, ModelActionSnapshot, ModelActionState }
