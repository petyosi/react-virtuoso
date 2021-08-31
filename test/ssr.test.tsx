/**
 * @jest-environment node
 */

import ReactDOMServer from 'react-dom/server'
import { JSDOM } from 'jsdom'
import * as React from 'react'
import ResizeObserver from 'resize-observer-polyfill'
// import { create } from 'react-test-renderer' // ES6
import { List } from '../src/List'
import { Grid } from '../src/Grid'

// TypeScript 4.1 does not yet include typings for ResizeObserver (4.2 does)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- NodeJS.Global is typed using a namespace
  namespace NodeJS {
    interface Global {
      ResizeObserver: typeof import('resize-observer-polyfill').default
    }
  }
}

describe('SSR List', () => {
  beforeAll(() => {
    global.ResizeObserver = ResizeObserver
  })

  it('renders 30 items', () => {
    const html = ReactDOMServer.renderToString(<List id="root" totalCount={20000} initialItemCount={30} />)
    const { document } = new JSDOM(html).window

    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(30)
  })

  it('renders 30 grid items', () => {
    const html = ReactDOMServer.renderToString(<Grid id="root" totalCount={20000} initialItemCount={30} />)
    const { document } = new JSDOM(html).window
    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(30)
  })

  it('renders 3 groups and their children', () => {
    const html = ReactDOMServer.renderToString(<List id="root" groupCounts={[10, 10, 10, 10, 10]} initialItemCount={25} />)
    const { document } = new JSDOM(html).window

    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(28)
  })

  it('renders 3 groups and their children (edge case)', () => {
    const html = ReactDOMServer.renderToString(<List id="root" groupCounts={[10, 10, 10, 10, 10]} initialItemCount={30} />)
    const { document } = new JSDOM(html).window

    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(33)
  })

  it('renders 30 items in window scroller mode', () => {
    const html = ReactDOMServer.renderToString(<List id="root" useWindowScroll totalCount={20000} initialItemCount={30} />)
    const { document } = new JSDOM(html).window

    expect(document.querySelector('#root > div > div')!.childElementCount).toEqual(30)
  })
})
