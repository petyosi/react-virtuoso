import { CallbackRefParam } from './Utils'
import { Item } from './OffsetList'
import ResizeObserver from 'resize-observer-polyfill'
import { ItemHeight } from 'VirtuosoStore'
import { TInput } from 'rxio'

export class ItemHeightPublisher {
  private itemHeights: TInput<ItemHeight[]>
  private itemElements: HTMLElement[] = []
  public observer?: ResizeObserver

  public constructor(itemHeights: TInput<ItemHeight[]>) {
    this.itemHeights = itemHeights
  }

  private publishSizes(items: HTMLElement[]) {
    const results: ItemHeight[] = []
    for (const item of items) {
      const index = parseInt(item.dataset.index!)
      const size = item.offsetHeight
      if (results.length === 0 || results[results.length - 1].size !== size) {
        results.push({ start: index, end: index, size })
      } else {
        results[results.length - 1].end++
      }
    }
    this.itemHeights(results)
  }

  public init() {
    this.observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      this.publishSizes(entries.map(({ target }) => target as HTMLElement))
    })
    this.publishSizes(this.itemElements)
    this.itemElements.map(item => {
      this.observer!.observe(item)
    })
  }

  public destroy() {
    this.itemElements = []
    this.observer!.disconnect()
  }

  public trackRef = (ref: CallbackRefParam) => {
    if (ref) {
      this.itemElements.push(ref)
    }
  }

  public getItemAttributes() {
    return (item: Item) => {
      return {
        'data-index': item.index,
        'data-known-size': item.size,
        ref: this.trackRef,
      }
    }
  }
}
