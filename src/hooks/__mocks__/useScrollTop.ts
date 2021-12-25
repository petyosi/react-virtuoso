type CallbackRefParam = HTMLElement | null

export default function useSize(callback: (state: [number, number]) => void) {
  const scrollerRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      ;(elRef as any).triggerScroll = (state: [number, number]) => {
        callback(state)
      }
    }
  }

  return { scrollerRef, scrollByCallback: () => {}, scrollToCallback: () => {} }
}
