import * as React from 'react'
import { ListRange, VirtuosoGrid } from '../src'

export function Example() {
  const { data, rangeRendered } = useDataPager(1000)
  return (
    <>
      <VirtuosoGrid
        initialTopMostItemIndex={300}
        data={data}
        itemContent={(index, dataItem) => (
          <div>
            Item {index} - data: {JSON.stringify(dataItem)}
          </div>
        )}
        rangeChanged={rangeRendered}
        style={{ height: 900, width: 1200 }}
      />
    </>
  )
}

const ITEMS_PER_PAGE = 40
export function useDataPager(initialCount: number) {
  const [data, setData] = React.useState<Array<string | undefined>>(() => Array.from({ length: initialCount }))
  const fetchedPages = React.useRef(new Set<number>())

  const loadPage = React.useCallback(
    (page: number) => {
      setTimeout(() => {
        setData((prevData) => {
          const data = prevData.slice()
          data.splice(
            page * ITEMS_PER_PAGE,
            ITEMS_PER_PAGE,
            ...Array.from({ length: ITEMS_PER_PAGE }, (_, index) => `My Item ${page * ITEMS_PER_PAGE + index}`)
          )
          return data
        })
      }, 1000)
    },
    [setData]
  )

  const rangeRendered = React.useCallback((range: ListRange) => {
    const firstPage = Math.floor(range.startIndex / ITEMS_PER_PAGE)
    const lastPage = Math.floor(range.endIndex / ITEMS_PER_PAGE)

    for (let page = firstPage; page <= lastPage; page++) {
      if (!fetchedPages.current.has(page)) {
        fetchedPages.current.add(page)
        loadPage(page)
      }
    }
  }, [])

  return { data, rangeRendered }
}
