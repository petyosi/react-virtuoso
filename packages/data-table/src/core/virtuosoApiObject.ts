import { sizeState$ } from '../resize/sizes'
import { cancelSmoothScroll$, scrollerElement$, scrollLocation$ } from '../scroll/dom'
import { scrollIntoView$, scrollToRow$ } from '../scroll/scroll-to-row'
import { findMaxKeyValue } from '../sizing/AATree'
import { data$ } from './data'

import type { VirtuosoDataTableMethods } from '../interfaces'
import type { Engine } from '@virtuoso.dev/reactive-engine-core'

export function virtuosoApiObject<Data>(engine: Engine): VirtuosoDataTableMethods<Data> {
  return {
    scrollToRow: (location) => {
      engine.pub(scrollToRow$, location)
    },

    scrollIntoView: (location) => {
      engine.pub(scrollIntoView$, location)
    },

    scrollerElement: () => {
      return engine.getValue(scrollerElement$)
    },

    getScrollLocation() {
      return engine.getValue(scrollLocation$)
    },

    cancelSmoothScroll(): void {
      engine.pub(cancelSmoothScroll$)
    },

    height: (item) => {
      const index = engine.getValue(data$)?.indexOf(item) ?? -1
      if (index === -1) {
        return 0
      }
      const { sizeTree } = engine.getValue(sizeState$)
      return findMaxKeyValue(sizeTree, index)[1] ?? 0
    },
  }
}
