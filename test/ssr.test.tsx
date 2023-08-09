/**
 * @jest-environment node
 */
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { Virtuoso, GroupedVirtuoso } from '../src/Virtuoso'
import { VirtuosoGrid } from '../src/VirtuosoGrid'
import { describe, it, expect } from 'vitest'

describe('SSR List', () => {
  it('renders 30 items', () => {
    const html = ReactDOMServer.renderToString(<Virtuoso id="root" totalCount={20000} initialItemCount={30} />)
    const { document } = new JSDOM(html).window

    expect(document.querySelector('#root > div > div')!.getAttribute('style')).not.toMatch('visibility:hidden')
    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(30)
  })

  it('renders 30 grid items', () => {
    const html = ReactDOMServer.renderToString(<VirtuosoGrid id="root" totalCount={20000} initialItemCount={30} />)
    const { document } = new JSDOM(html).window
    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(30)
    expect(document.querySelector('#root > div > div > div')?.innerHTML).toEqual('Item 0')
  })

  it('renders 30 grid items with offset', () => {
    const html = ReactDOMServer.renderToString(
      <Virtuoso
        id="root"
        data={[
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          35, 36, 37, 38, 39, 40,
        ]}
        totalCount={20000}
        initialItemCount={30}
        initialTopMostItemIndex={10}
        itemContent={(_: number, item: any) => `Item ${item}`}
      />
    )
    const { document } = new JSDOM(html).window

    expect(document.querySelector('#root > div > div')!.getAttribute('style')).not.toMatch('visibility:hidden')
    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(30)
    expect(document.querySelector('#root > div > div > div')?.innerHTML).toEqual('Item 10')
  })

  it('renders 3 groups and their children', () => {
    const html = ReactDOMServer.renderToString(<GroupedVirtuoso id="root" groupCounts={[10, 10, 10, 10, 10]} initialItemCount={25} />)
    const { document } = new JSDOM(html).window

    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(28)
  })

  it('renders 3 groups and their children (edge case)', () => {
    const html = ReactDOMServer.renderToString(<GroupedVirtuoso id="root" groupCounts={[10, 10, 10, 10, 10]} initialItemCount={30} />)
    const { document } = new JSDOM(html).window

    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(33)
  })

  it('renders 30 items in window scroller mode', () => {
    const html = ReactDOMServer.renderToString(<Virtuoso id="root" useWindowScroll totalCount={20000} initialItemCount={30} />)
    const { document } = new JSDOM(html).window

    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(30)
  })
})
