// TODO: framer still not have flushSync in there framer version, skip that temporarily
// import { flushSync } from 'react-dom';

export default function conditionalFlushSync(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  flag: boolean
) {
  // return flag ? flushSync : (cb: () => void) => cb();
  return (cb: () => void) => cb()
}
