import { SizeRange } from '../../sizeSystem'

type CallbackRefParam = HTMLElement | null

export default function useChangedChildSizes(callback: (sizes: SizeRange[]) => void) {
  const callbackRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      ;(elRef as any).triggerChangedChildSizes = (sizes: SizeRange[]) => {
        callback(sizes)
      }
    }
  }

  return callbackRef
}
