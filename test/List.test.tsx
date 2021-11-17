/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as React from 'react'
import { act, render } from '@testing-library/react'
import { List } from '../src/List'
jest.mock('../src/hooks/useSize')
jest.mock('../src/hooks/useChangedChildSizes')
jest.mock('../src/hooks/useScrollTop')

describe('List', () => {
  it('renders a probe item initially', () => {
    const { container } = render(<List totalCount={20000} />)

    const scroller: any = container.firstElementChild
    const viewport = scroller.firstElementChild
    const listParent = viewport.firstElementChild

    act(() => {
      scroller.triggerScroll(0)
      viewport.triggerResize({ getBoundingClientRect: () => ({ height: 700 }) })
    })

    expect(listParent.children).toHaveLength(1)
    expect(listParent.textContent).toBe('Item 0')
  })

  describe('rendered list', () => {
    let container: any
    let scroller: any
    let viewport: any
    let listParent: any

    beforeEach(() => {
      container = render(<List totalCount={20000} />, container).container

      scroller = container.firstElementChild
      viewport = scroller.firstElementChild
      listParent = viewport.firstElementChild

      act(() => {
        scroller.triggerScroll(0)
        viewport.triggerResize({ getBoundingClientRect: () => ({ height: 700 }) })
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
    let container: any
    let scroller: any
    let viewport: any
    let listParent: any
    const data: any = Array.from({ length: 1000 }).map((_, i) => `Item ${i}`)

    beforeEach(() => {
      container = render(<List data={data} itemContent={(_: number, data: string) => data} />).container

      scroller = container.firstElementChild
      viewport = scroller.firstElementChild
      listParent = viewport.firstElementChild

      act(() => {
        scroller.triggerScroll(0)
        viewport.triggerResize({ getBoundingClientRect: () => ({ height: 700 }) })
        listParent.triggerChangedChildSizes([{ startIndex: 0, endIndex: 0, size: 10 }])
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
          <List data={data} itemContent={(_: number, item: { name: string }) => item.name} />
          <button onClick={() => setData([{ name: 'Item 0' }])}>Set Data</button>
        </>
      )
    }

    const { container } = render(<Case />)

    const scroller: any = container.firstElementChild
    const viewport = scroller.firstElementChild
    const listParent = viewport.firstElementChild

    act(() => {
      scroller.triggerScroll(0)
      viewport.triggerResize({ getBoundingClientRect: () => ({ height: 100 }) })
      listParent.triggerChangedChildSizes([{ startIndex: 0, endIndex: 0, size: 10 }])
      container.querySelector('button')!.click()
    })

    expect(listParent.firstElementChild.textContent).toBe('Item 0')
  })

  it('updates when data is propagated (same length)', () => {
    const Case = () => {
      const [data, setData] = React.useState([{ name: 'Item 0' }] as any[])

      return (
        <>
          <List
            data={data}
            itemContent={(_: number, item: { name: string }) => {
              return item.name
            }}
          />
          <button onClick={() => setData([{ name: 'Item 1' }])}>Set Data</button>
        </>
      )
    }

    const { container } = render(<Case />)

    const scroller: any = container.firstElementChild
    const viewport = scroller.firstElementChild
    const listParent = viewport.firstElementChild

    act(() => {
      scroller.triggerScroll(0)
      viewport.triggerResize({ getBoundingClientRect: () => ({ height: 100 }) })
      listParent.triggerChangedChildSizes([{ startIndex: 0, endIndex: 0, size: 10 }])
      container.querySelector('button')!.click()
    })

    expect(listParent.firstElementChild.textContent).toBe('Item 1')
  })
})
