import type { FC } from 'react'

export const SuspenceTrigger: FC<{ promise: Promise<unknown> }> = ({ promise }) => {
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw promise
}
