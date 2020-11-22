type CallbackRefParam = HTMLElement | null

export default function useSize(callback: (scrollTop: number) => void) {
  const scrollerRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      ;(elRef as any).triggerScroll = (scrollTop: number) => {
        callback(scrollTop)
      }
    }
  }

  return { scrollerRef, scrollByCallback: () => {}, scrollToCallback: () => {} }
}
