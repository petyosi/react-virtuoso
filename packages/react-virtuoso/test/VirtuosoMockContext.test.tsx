import React from 'react'

import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  GroupedTableVirtuoso,
  GroupedVirtuoso,
  TableVirtuoso,
  Virtuoso,
  VirtuosoGrid,
  VirtuosoGridMockContext,
  VirtuosoMockContext,
} from '../src'

import type { VirtuosoHandle } from '../src'

function renderedIndices(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-index]')).map((el) => el.dataset.index)
}

describe('VirtuosoMockContext', () => {
  interface Item {
    id: string
    value: string
  }
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
          <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 300 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })

    it('correctly renders items with useWindowScroll', () => {
      const { container } = render(<Virtuoso data={data} useWindowScroll />, {
        wrapper: ({ children }) => (
          <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 300 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })

    it('offsets the window viewport by the sticky top items height', () => {
      const { container } = render(<Virtuoso data={data} topItemCount={2} useWindowScroll />, {
        wrapper: ({ children }) => (
          <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 300 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })

    it('starts at the initialTopMostItemIndex', async () => {
      const { container } = render(<Virtuoso initialTopMostItemIndex={50} itemContent={(index) => `Item ${index}`} totalCount={100} />, {
        wrapper: ({ children }) => (
          <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 300 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      await waitFor(() => {
        expect(Array.from(container.querySelectorAll('[data-index]')).map((el) => el.textContent)).toEqual([
          'Item 50',
          'Item 51',
          'Item 52',
        ])
      })
    })

    it('clamps the initialTopMostItemIndex to the end of the list', async () => {
      const { container } = render(<Virtuoso initialTopMostItemIndex={99} itemContent={(index) => `Item ${index}`} totalCount={100} />, {
        wrapper: ({ children }) => (
          <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 300 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      await waitFor(() => {
        expect(renderedIndices(container)).toEqual(['97', '98', '99'])
      })
    })

    it('aligns the initialTopMostItemIndex to the end', async () => {
      const { container } = render(
        <Virtuoso initialTopMostItemIndex={{ align: 'end', index: 50 }} itemContent={(index) => `Item ${index}`} totalCount={100} />,
        {
          wrapper: ({ children }) => (
            <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 300 }}>{children}</VirtuosoMockContext.Provider>
          ),
        }
      )

      await waitFor(() => {
        expect(renderedIndices(container)).toEqual(['48', '49', '50'])
      })
    })

    it('scrolls to an index imperatively', async () => {
      const ref = React.createRef<VirtuosoHandle>()
      const { container } = render(<Virtuoso itemContent={(index) => `Item ${index}`} ref={ref} totalCount={100} />, {
        wrapper: ({ children }) => (
          <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 300 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      act(() => {
        ref.current!.scrollToIndex(30)
      })
      await waitFor(() => {
        expect(renderedIndices(container)).toEqual(['30', '31', '32'])
      })

      act(() => {
        ref.current!.scrollToIndex({ behavior: 'smooth', index: 60 })
      })
      await waitFor(() => {
        expect(renderedIndices(container)).toEqual(['60', '61', '62'])
      })
    })
  })

  describe('GroupedList', () => {
    it('starts at the initialTopMostItemIndex', async () => {
      const { container } = render(
        <GroupedVirtuoso
          groupContent={(index) => `Group ${index}`}
          groupCounts={[50, 50]}
          initialTopMostItemIndex={20}
          itemContent={(index) => `Item ${index}`}
        />,
        {
          wrapper: ({ children }) => (
            <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 300 }}>{children}</VirtuosoMockContext.Provider>
          ),
        }
      )

      // the scroll position is offset by the sticky group header, so item 19 is rendered underneath it
      await waitFor(() => {
        expect(Array.from(container.querySelectorAll('[data-index]')).map((el) => el.textContent)).toEqual([
          'Group 0',
          'Item 19',
          'Item 20',
          'Item 21',
        ])
      })
    })

    it('passes the index of the item within its group to itemContent', () => {
      const { container } = render(
        <GroupedVirtuoso
          groupContent={(index) => `Group ${index}`}
          groupCounts={[2, 3]}
          itemContent={(index, groupIndex, _data, _context, indexInGroup) => `${index}:${groupIndex}:${indexInGroup}`}
        />,
        {
          wrapper: ({ children }) => (
            <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 1000 }}>{children}</VirtuosoMockContext.Provider>
          ),
        }
      )

      expect(Array.from(container.querySelectorAll('[data-item-group-index]')).map((el) => el.textContent)).toEqual([
        '0:0:0',
        '1:0:1',
        '2:1:0',
        '3:1:1',
        '4:1:2',
      ])
    })

    it('keeps indexInGroup relative to the group when firstItemIndex is set', () => {
      const { container } = render(
        <GroupedVirtuoso
          firstItemIndex={1000}
          groupContent={(index) => `Group ${index}`}
          groupCounts={[2, 3]}
          itemContent={(index, groupIndex, _data, _context, indexInGroup) => `${index}:${groupIndex}:${indexInGroup}`}
        />,
        {
          wrapper: ({ children }) => (
            <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 1000 }}>{children}</VirtuosoMockContext.Provider>
          ),
        }
      )

      expect(Array.from(container.querySelectorAll('[data-item-group-index]')).map((el) => el.textContent)).toEqual([
        '1000:0:0',
        '1001:0:1',
        '1002:1:0',
        '1003:1:1',
        '1004:1:2',
      ])
    })
  })

  describe('Table', () => {
    it('correctly renders items', () => {
      const { container } = render(<TableVirtuoso data={data} />, {
        wrapper: ({ children }) => (
          <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 300 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })

    it('correctly renders items with useWindowScroll', () => {
      const { container } = render(<TableVirtuoso data={data} useWindowScroll />, {
        wrapper: ({ children }) => (
          <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 300 }}>{children}</VirtuosoMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })

    it('starts at the initialTopMostItemIndex', async () => {
      const { container } = render(
        <TableVirtuoso initialTopMostItemIndex={50} itemContent={(index) => <td>Item {index}</td>} totalCount={100} />,
        {
          wrapper: ({ children }) => (
            <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 300 }}>{children}</VirtuosoMockContext.Provider>
          ),
        }
      )

      await waitFor(() => {
        expect(renderedIndices(container)).toEqual(['50', '51', '52'])
      })
    })

    it('passes the index of the item within its group to the grouped table itemContent', () => {
      const { container } = render(
        <GroupedTableVirtuoso
          groupContent={(index) => <td>Group {index}</td>}
          groupCounts={[2, 3]}
          itemContent={(index, groupIndex, _data, _context, indexInGroup) => <td>{`${index}:${groupIndex}:${indexInGroup}`}</td>}
        />,
        {
          wrapper: ({ children }) => (
            <VirtuosoMockContext.Provider value={{ itemHeight: 100, viewportHeight: 1000 }}>{children}</VirtuosoMockContext.Provider>
          ),
        }
      )

      expect(Array.from(container.querySelectorAll('[data-item-group-index]')).map((el) => el.textContent)).toEqual([
        '0:0:0',
        '1:0:1',
        '2:1:0',
        '3:1:1',
        '4:1:2',
      ])
    })
  })

  describe('Grid', () => {
    it('correctly renders items', () => {
      const { container } = render(<VirtuosoGrid data={data} />, {
        wrapper: ({ children }) => (
          <VirtuosoGridMockContext.Provider value={{ itemHeight: 100, itemWidth: 100, viewportHeight: 200, viewportWidth: 300 }}>
            {children}
          </VirtuosoGridMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })

    it('renders a single row of items when necessary', () => {
      const { container } = render(<VirtuosoGrid data={data} />, {
        wrapper: ({ children }) => (
          <VirtuosoGridMockContext.Provider value={{ itemHeight: 100, itemWidth: 100, viewportHeight: 100, viewportWidth: 300 }}>
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
          <VirtuosoGridMockContext.Provider value={{ itemHeight: 100, itemWidth: 100, viewportHeight: 200, viewportWidth: 300 }}>
            {children}
          </VirtuosoGridMockContext.Provider>
        ),
      })

      expect(container.querySelectorAll('.virtuoso-grid-item')).toHaveLength(1)
    })

    it('correctly renders items with useWindowScroll', () => {
      const { container } = render(<VirtuosoGrid data={data} useWindowScroll />, {
        wrapper: ({ children }) => (
          <VirtuosoGridMockContext.Provider value={{ itemHeight: 100, itemWidth: 100, viewportHeight: 200, viewportWidth: 300 }}>
            {children}
          </VirtuosoGridMockContext.Provider>
        ),
      })

      expect(container).toMatchSnapshot()
    })
  })
})
