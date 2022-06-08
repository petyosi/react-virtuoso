import { ScrollContainerState } from '../../interfaces'

type CallbackRefParam = HTMLElement | null

export default function useSize(callback: (state: ScrollContainerState) => void) {
  const scrollerRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      ;(elRef as any).triggerScroll = (state: ScrollContainerState) => {
        callback(state)
      }
    }
  }

  return { scrollerRef, scrollByCallback: () => {}, scrollToCallback: () => {} }
}
