/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as React from 'react'
import ReactDOM from 'react-dom/client'
import { VirtuosoGrid } from '../src/VirtuosoGrid'

import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest'
import { act } from 'react-dom/test-utils'

vi.mock('../src/hooks/useSize')
vi.mock('../src/hooks/useScrollTop')
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('Grid', () => {
  let container: HTMLDivElement
  beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    // cleanup on exiting
    document.body.removeChild(container)
  })

  it('renders a probe item initially', () => {
    act(() => {
      ReactDOM.createRoot(container).render(<VirtuosoGrid totalCount={20000} />)
    })

    const scroller = container.firstElementChild as any
    const viewport = scroller.firstElementChild
    const listParent = viewport.firstElementChild

    act(() => {
      scroller.triggerScroll({ scrollTop: 0, scrollHeight: 700, viewportHeight: 200 })
      viewport.triggerResize({ getBoundingClientRect: () => ({ height: 700 }) })
    })

    expect(listParent.children).toHaveLength(1)
    expect(listParent.textContent).toBe('Item 0')
  })

  describe('data list', () => {
    let scroller: any
    let viewport: any
    let listParent: any
    const data: any = Array.from({ length: 1000 }).map((_, i) => `Item ${i}`)

    beforeEach(() => {
      act(() => {
        ReactDOM.createRoot(container).render(<VirtuosoGrid data={data} itemContent={(_: number, data: string) => data} />)
      })

      scroller = container.firstElementChild
      viewport = scroller.firstElementChild
      listParent = viewport.firstElementChild

      act(() => {
        scroller.triggerScroll({ scrollTop: 0, scrollHeight: 700, viewportHeight: 200 })
        viewport.triggerResize({ getBoundingClientRect: () => ({ height: 700 }) })
      })
    })

    it('renders the list with the data item', () => {
      expect(listParent.firstElementChild.textContent).toBe('Item 0')
    })
  })

  it('updates when data is propagated', () => {
    const Case = () => {
      const [data, setData] = React.useState([] as any[])

      return (
        <>
          <VirtuosoGrid data={data} itemContent={(_: number, item: { name: string }) => item.name} />
          <button onClick={() => setData([{ name: 'Item 0' }])}>Set Data</button>
        </>
      )
    }

    act(() => {
      ReactDOM.createRoot(container).render(<Case />)
    })

    const scroller = container.firstElementChild as any
    const viewport = scroller.firstElementChild
    const listParent = viewport.firstElementChild

    act(() => {
      scroller.triggerScroll({ scrollTop: 0, scrollHeight: 700, viewportHeight: 200 })
      viewport.triggerResize({ getBoundingClientRect: () => ({ height: 100 }) })
      container.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(listParent.firstElementChild.textContent).toBe('Item 0')
  })

  it('updates when data is propagated (same length)', () => {
    const Case = () => {
      const [data, setData] = React.useState([{ name: 'Item 0' }] as any[])

      return (
        <>
          <VirtuosoGrid
            data={data}
            itemContent={(_: number, item: { name: string }) => {
              return item.name
            }}
          />
          <button onClick={() => setData([{ name: 'Item 1' }])}>Set Data</button>
        </>
      )
    }

    act(() => {
      ReactDOM.createRoot(container).render(<Case />)
    })

    const scroller = container.firstElementChild as any
    const viewport = scroller.firstElementChild
    const listParent = viewport.firstElementChild

    act(() => {
      scroller.triggerScroll({ scrollTop: 0, scrollHeight: 700, viewportHeight: 200 })
      viewport.triggerResize({ getBoundingClientRect: () => ({ height: 100 }) })
      container.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(listParent.firstElementChild.textContent).toBe('Item 1')
  })
})
