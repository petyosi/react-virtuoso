/**
 * @jest-environment node
 */

import ReactDOMServer from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { Virtuoso, GroupedVirtuoso } from '../src/Virtuoso'
import { VirtuosoGrid } from '../src/VirtuosoGrid'
import { describe, it, expect } from 'vitest'

describe('SSR List', () => {
  it('renders 30 items', () => {
    const html = ReactDOMServer.renderToString(<Virtuoso id="root" totalCount={20000} initialItemCount={30} />)
    const { document } = new JSDOM(html).window

    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(30)
  })

  it('renders 30 grid items', () => {
    const html = ReactDOMServer.renderToString(<VirtuosoGrid id="root" totalCount={20000} initialItemCount={30} />)
    const { document } = new JSDOM(html).window
    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(30)
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
