import * as React from 'react'
import { act } from 'react'

import ReactDOM from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TableVirtuoso } from '../src/TableVirtuoso'

const skipAnimationFrameArgs = vi.hoisted(() => [] as (boolean | undefined)[])

vi.mock('../src/hooks/useSize', () => {
  return {
    default: function mockedUseSize(callback: (e: HTMLElement) => void, _enabled?: boolean, skipAnimationFrame?: boolean) {
      skipAnimationFrameArgs.push(skipAnimationFrame)
      return (elRef: HTMLElement | null) => {
        if (elRef) {
          ;(elRef as any).triggerResize = (state: any) => {
            callback({ ...elRef, ...state })
          }
        }
      }
    },
  }
})

vi.mock('../src/hooks/useChangedChildSizes')
vi.mock('../src/hooks/useScrollTop')
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('TableVirtuoso', () => {
  let container: HTMLDivElement
  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    skipAnimationFrameArgs.length = 0
  })

  afterEach(() => {
    container.remove()
  })

  it('does not spread skipAnimationFrameInResizeObserver onto the scroller', () => {
    const scrollerProps: Record<string, unknown>[] = []
    const Scroller = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function Scroller(props, ref) {
      scrollerProps.push(props as Record<string, unknown>)
      return <div {...props} ref={ref} />
    })

    act(() => {
      ReactDOM.createRoot(container).render(<TableVirtuoso components={{ Scroller }} skipAnimationFrameInResizeObserver totalCount={10} />)
    })

    const scroller = container.firstElementChild as HTMLElement
    expect(scroller.getAttribute('skipAnimationFrameInResizeObserver')).toBeNull()
    expect(scroller.getAttribute('skipanimationframeinresizeobserver')).toBeNull()
    expect(scrollerProps.length).toBeGreaterThan(0)
    for (const props of scrollerProps) {
      expect(props).not.toHaveProperty('skipAnimationFrameInResizeObserver')
    }
  })

  it('publishes skipAnimationFrameInResizeObserver to the resize observer', () => {
    act(() => {
      ReactDOM.createRoot(container).render(<TableVirtuoso skipAnimationFrameInResizeObserver totalCount={10} />)
    })

    expect(skipAnimationFrameArgs).toContain(true)
  })
})
