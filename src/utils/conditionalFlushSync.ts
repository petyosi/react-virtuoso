import { flushSync } from 'react-dom'

export default function conditionalFlushSync(flag: boolean) {
  return flag ? flushSync : (cb: () => void) => cb()
}
