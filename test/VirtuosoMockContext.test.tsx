import { render } from '@testing-library/react'
import * as React from 'react'
import { Virtuoso, VirtuosoMockContext, TableVirtuoso } from '../src'

describe('VirtuosoMockContext', () => {
  type Item = { id: string; value: string }
  const data: Item[] = [
    { id: '1', value: 'foo' },
    { id: '2', value: 'bar' },
    { id: '3', value: 'baz' },
    { id: '4', value: 'ban' },
  ]

  describe('List', () => {
    it('correctly renders items', () => {
      const { container } = render(<Virtuoso data={data} />, {
        wrapper: ({ children }) => (
          <VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })

    it('correctly renders items with useWindowScroll', () => {
      const { container } = render(<Virtuoso data={data} useWindowScroll />, {
        wrapper: ({ children }) => (
          <VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })
  })

  describe('Table', () => {
    it('correctly renders items', () => {
      const { container } = render(<TableVirtuoso data={data} />, {
        wrapper: ({ children }) => (
          <VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })

    it('correctly renders items with useWindowScroll', () => {
      const { container } = render(<TableVirtuoso data={data} useWindowScroll />, {
        wrapper: ({ children }) => (
          <VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })
  })
})
