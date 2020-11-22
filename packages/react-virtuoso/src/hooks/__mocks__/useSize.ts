type CallbackRefParam = HTMLElement | null

export default function useSize(callback: (e: HTMLElement) => void) {
  const callbackRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      ;(elRef as any).triggerResize = (state: any) => {
        callback({ ...elRef, ...state })
      }
    }
  }

  return callbackRef
}
