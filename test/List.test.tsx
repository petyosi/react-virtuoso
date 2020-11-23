import * as React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'
import { List } from '../src/List'
jest.mock('../src/hooks/useSize')
jest.mock('../src/hooks/useChangedChildSizes')
jest.mock('../src/hooks/useScrollTop')

describe('List', () => {
  let container: any
  beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container as any)
    container.remove()
  })

  it('renders a probe item initially', () => {
    act(() => {
      render(<List totalCount={20000} />, container)
    })

    const scroller = container.firstElementChild
    const viewport = scroller.firstElementChild
    const listParent = viewport.firstElementChild

    act(() => {
      scroller.triggerScroll(0)
      viewport.triggerResize({ offsetHeight: 700 })
    })

    expect(listParent.children).toHaveLength(1)
    expect(listParent.textContent).toBe('Item 0')
  })

  describe('rendered list', () => {
    let scroller: any
    let viewport: any
    let listParent: any

    beforeEach(() => {
      act(() => {
        render(<List totalCount={20000} />, container)
      })

      scroller = container.firstElementChild
      viewport = scroller.firstElementChild
      listParent = viewport.firstElementChild

      act(() => {
        scroller.triggerScroll(0)
        viewport.triggerResize({ offsetHeight: 700 })
        listParent.triggerChangedChildSizes([{ startIndex: 0, endIndex: 0, size: 30 }])
      })
    })

    it('renders the list as soon as the viewport dimensions are clear', () => {
      expect(listParent.children).toHaveLength(24)
    })

    it('changes the list if items resize', () => {
      act(() => {
        listParent.triggerChangedChildSizes([{ startIndex: 10, endIndex: 12, size: 50 }])
      })

      expect(listParent.children).toHaveLength(22)
    })

    it('renders new items when scrolling', () => {
      act(() => {
        scroller.triggerScroll(600)
      })
      expect(listParent.firstElementChild.dataset.index).toBe('20')
    })
  })

  describe('data list', () => {
    let scroller: any
    let viewport: any
    let listParent: any
    let data: any = Array.from({ length: 1000 }).map((_, i) => `Item ${i}`)

    beforeEach(() => {
      act(() => {
        render(<List data={data} itemContent={(_: number, data: string) => data} />, container)
      })

      scroller = container.firstElementChild
      viewport = scroller.firstElementChild
      listParent = viewport.firstElementChild

      act(() => {
        scroller.triggerScroll(0)
        viewport.triggerResize({ offsetHeight: 100 })
        listParent.triggerChangedChildSizes([{ startIndex: 0, endIndex: 0, size: 10 }])
      })
    })

    it('renders the list with the data item', () => {
      expect(listParent.firstElementChild.textContent).toBe('Item 0')
    })
  })
})
