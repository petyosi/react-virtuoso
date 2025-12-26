import type { FC } from 'react'

export const SuspenceTrigger: FC<{ promise: Promise<unknown> }> = ({ promise }) => {
  throw promise
}
