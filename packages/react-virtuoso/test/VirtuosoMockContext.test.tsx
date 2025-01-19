import React from 'react'
import { render } from '@testing-library/react'
import { Virtuoso, VirtuosoMockContext, TableVirtuoso, VirtuosoGrid, VirtuosoGridMockContext } from '../src'
import { describe, it, expect } from 'vitest'

describe('VirtuosoMockContext', () => {
  type Item = { id: string; value: string }
  const data: Item[] = [
    { id: '1', value: 'foo' },
    { id: '2', value: 'bar' },
    { id: '3', value: 'baz' },
    { id: '4', value: 'ban' },
    { id: '5', value: 'bam' },
    { id: '6', value: 'baw' },
    { id: '7', value: 'bae' },
    { id: '8', value: 'bat' },
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

  describe('Grid', () => {
    it('correctly renders items', () => {
      const { container } = render(<VirtuosoGrid data={data} />, {
        wrapper: ({ children }) => (
          <VirtuosoGridMockContext.Provider value={{ viewportHeight: 200, viewportWidth: 300, itemHeight: 100, itemWidth: 100 }}>
            {children}
          </VirtuosoGridMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })

    it('renders a single row of items when necessary', () => {
      const { container } = render(<VirtuosoGrid data={data} />, {
        wrapper: ({ children }) => (
          <VirtuosoGridMockContext.Provider value={{ viewportHeight: 100, viewportWidth: 300, itemHeight: 100, itemWidth: 100 }}>
            {children}
          </VirtuosoGridMockContext.Provider>
        ),
      })

      expect(container.querySelectorAll('.virtuoso-grid-item')).toHaveLength(3)
    })

    it('does not overflow the index', () => {
      const fourItemData = data.slice(0, 1)

      const { container } = render(<VirtuosoGrid data={fourItemData} />, {
        wrapper: ({ children }) => (
          <VirtuosoGridMockContext.Provider value={{ viewportHeight: 200, viewportWidth: 300, itemHeight: 100, itemWidth: 100 }}>
            {children}
          </VirtuosoGridMockContext.Provider>
        ),
      })

      expect(container.querySelectorAll('.virtuoso-grid-item')).toHaveLength(1)
    })

    it('correctly renders items with useWindowScroll', () => {
      const { container } = render(<VirtuosoGrid data={data} useWindowScroll />, {
        wrapper: ({ children }) => (
          <VirtuosoGridMockContext.Provider value={{ viewportHeight: 200, viewportWidth: 300, itemHeight: 100, itemWidth: 100 }}>
            {children}
          </VirtuosoGridMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })
  })
})
