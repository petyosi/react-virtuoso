import { debounce } from 'lodash'
import * as React from 'react'
import { createHashRouter, Link, RouterProvider, useParams, useSearchParams } from 'react-router-dom'

import { GridComponents, GridStateSnapshot, ListRange, VirtuosoGrid } from '../src'

function fetchData(page: number) {
  return new Promise<string[]>((resolve) => {
    setTimeout(() => {
      resolve(Array.from({ length: ITEMS_PER_PAGE }, (_, index) => `My Item ${page * ITEMS_PER_PAGE + index}`))
    }, 600)
  })
}

const itemContent = (index: number, data: string | undefined) => {
  return (
    <div style={{ backgroundColor: 'red', border: '1px solid black', height: 200 }}>
      Item {index} -{' '}
      {data ? (
        <div>
          <Link to={`/item/${index}`}>See details</Link>
          {data}
        </div>
      ) : (
        'loading...'
      )}
    </div>
  )
}

const LOCAL_STORAGE_KEY = 'gridStateSnapshot'

const persistState = debounce((snapshot: GridStateSnapshot) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot))
}, 300)

function loadPersistedState() {
  let snapshot: GridStateSnapshot | null = null
  const savedState = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (savedState) {
    snapshot = JSON.parse(savedState) as GridStateSnapshot
  }
  return snapshot
}

const ITEMS_PER_PAGE = 50

function Detail() {
  const { id } = useParams()
  return <div>Detail - {id}</div>
}

function Example() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialState = React.useMemo(loadPersistedState, [])

  // sharing the URL with the page will load the page (but not the exact scroll location of the sharer)
  // however, if there's a local state, the local state should take precedence
  const initialTopMostItemIndex = React.useMemo(() => {
    if (initialState) {
      return null
    }
    return (Number(searchParams.get('page')) || 0) * ITEMS_PER_PAGE
  }, [searchParams, initialState])
  const { data, loadNextPage, rangeRendered } = useDataPager(1000, initialTopMostItemIndex)

  const rangeChanged = React.useCallback(
    (range: ListRange) => {
      rangeRendered(range)
      const currentPage = Math.floor(range.endIndex / ITEMS_PER_PAGE)
      if (currentPage === 0) {
        setSearchParams({})
      } else {
        setSearchParams({ page: currentPage.toString() })
      }
    },
    [rangeRendered, setSearchParams]
  )

  return (
    <div>
      <div>some header</div>
      <VirtuosoGrid
        components={{
          List: TheList,
        }}
        initialItemCount={40} // if set to INITIAL_ITEM_COUNT, end reached is never called, wonder if this is correct.
        {...(initialTopMostItemIndex !== null ? { initialTopMostItemIndex } : {})}
        data={data}
        endReached={loadNextPage}
        itemContent={itemContent}
        rangeChanged={rangeChanged}
        restoreStateFrom={initialState}
        stateChanged={persistState}
        useWindowScroll
      />
    </div>
  )
}

// poor man's data pager - better to use something like react-query or the equivalent, so that caching is handled properly
function useDataPager(initialCount: number, initialTopMostItemIndex: null | number) {
  const [data, setData] = React.useState<(string | undefined)[]>(() => Array.from({ length: initialCount }))
  const fetchedPages = React.useRef(new Set<number>())

  const loadPage = React.useCallback(
    (page: number) => {
      void fetchData(page).then((dataPage) => {
        setData((prevData) => {
          return [...prevData.slice(0, page * ITEMS_PER_PAGE), ...dataPage, ...prevData.slice((page + 1) * ITEMS_PER_PAGE)]
        })
      })
    },
    [setData]
  )

  const loadNextPage = React.useCallback(() => {
    const nextPage = Math.floor(data.length / ITEMS_PER_PAGE)
    fetchedPages.current.add(nextPage)
    void fetchData(nextPage).then((dataPage) => {
      setData((prevData) => {
        return [...prevData, ...dataPage]
      })
    })
  }, [data.length])

  const rangeRendered = React.useCallback(
    (range: ListRange) => {
      const firstPage = Math.floor(range.startIndex / ITEMS_PER_PAGE)
      const lastPage = Math.floor(range.endIndex / ITEMS_PER_PAGE)

      for (let page = firstPage; page <= lastPage; page++) {
        if (!fetchedPages.current.has(page)) {
          fetchedPages.current.add(page)
          loadPage(page)
        }
      }
    },
    [loadPage]
  )

  // load the first page
  if (initialTopMostItemIndex !== null) {
    console.log('load initial page')
    loadPage(0)
  }

  return { data, loadNextPage, rangeRendered }
}

const router = createHashRouter([
  { element: <Example />, path: '/' },
  { element: <Detail />, path: '/item/:id' },
])

const TheList: GridComponents['List'] = React.forwardRef(({ style, ...props }, ref) => {
  return <div ref={ref} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', ...style }} {...props} />
})

export function WithRouter() {
  return <RouterProvider router={router} />
}
