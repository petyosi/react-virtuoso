import invariant from 'tiny-invariant'

import type { DiagnosticCycleRef, DiagnosticTransaction } from './diagnostics'

const MAX_SETTLE_WAVES = 1000

interface SettleWork {
  coveredBy?: SettleWork
  delivered?: boolean
  key?: symbol
  owner?: object
  parentCycle?: DiagnosticCycleRef
  run: (transaction: DiagnosticTransaction | undefined, parentCycle: DiagnosticCycleRef | undefined) => boolean
}

interface PropagationContext {
  diagnostics?: DiagnosticTransaction
  settleQueue?: SettleWork[]
}

let currentContext: PropagationContext | undefined

export function runInPropagationContext<T>(diagnostics: DiagnosticTransaction | undefined, callback: () => T): T {
  if (currentContext !== undefined) {
    return callback()
  }

  const context: PropagationContext = {}
  if (diagnostics !== undefined) {
    context.diagnostics = diagnostics
  }
  currentContext = context
  try {
    const result = callback()
    let wave = 0
    while (context.settleQueue !== undefined && context.settleQueue.length > 0) {
      wave += 1
      if (wave > MAX_SETTLE_WAVES) {
        throw new Error(`afterSettle exceeded ${MAX_SETTLE_WAVES} waves; check for a feedback loop`)
      }
      const work = context.settleQueue.splice(0)
      for (const item of work) {
        if (item.coveredBy?.delivered === true) {
          item.delivered = true
        } else {
          item.delivered = item.run(context.diagnostics, item.parentCycle)
        }
      }
    }
    return result
  } finally {
    currentContext = undefined
  }
}

export function scheduleAfterSettle(
  run: (transaction: DiagnosticTransaction | undefined, parentCycle: DiagnosticCycleRef | undefined) => boolean,
  key?: symbol,
  owner?: object,
  ownerIsAncestor?: (owner: object) => boolean
) {
  invariant(currentContext, 'afterSettle can only schedule during propagation')
  let coveredBy: SettleWork | undefined
  if (key !== undefined && owner !== undefined) {
    const previous = currentContext.settleQueue?.findLast((item) => item.key === key)
    if (previous?.owner !== undefined && previous.owner !== owner && ownerIsAncestor?.(previous.owner) === true) {
      coveredBy = previous
    }
  }
  const item: SettleWork = { run }
  if (coveredBy !== undefined) {
    item.coveredBy = coveredBy
  }
  if (key !== undefined) {
    item.key = key
  }
  if (owner !== undefined) {
    item.owner = owner
  }
  if (currentContext.diagnostics?.activeCycle !== undefined) {
    item.parentCycle = currentContext.diagnostics.activeCycle
  }
  ;(currentContext.settleQueue ??= []).push(item)
}
