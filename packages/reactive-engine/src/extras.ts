import type { Engine } from './Engine'

import { e } from './e'
import { Cell, Stream } from './nodes'
import { addNodeInit } from './nodeUtils'

interface QueryLoadingResult {
  data: null
  error: null
  isLoading: true
  type: 'loading'
}

interface QuerySuccessResult<T> {
  data: T
  error: null
  isLoading: false
  type: 'success'
}

interface QueryErrorResult {
  data: null
  error: unknown
  isLoading: false
  type: 'error'
}

type QueryResult<T> = QueryErrorResult | QueryLoadingResult | QuerySuccessResult<T>

const INITIAL_QUERY_RESULT: QueryLoadingResult = {
  data: null,
  error: null,
  isLoading: true,
  type: 'loading',
}

export function AsyncQuery<I, O>(query: (params: I) => Promise<O>, defaultParams: I) {
  const input$ = Stream<I>()
  const output$ = Cell<QueryResult<O>>(INITIAL_QUERY_RESULT)

  function runQuery(params: I, engine: Engine) {
    engine.pub(output$, INITIAL_QUERY_RESULT)
    query(params)
      .then((data) => {
        engine.pub(output$, {
          data,
          error: null,
          isLoading: false,
          type: 'success',
        })
      })
      .catch((error: unknown) => {
        engine.pub(output$, {
          data: null,
          error,
          isLoading: false,
          type: 'error',
        })
      })
  }

  addNodeInit(output$, (engine) => {
    runQuery(defaultParams, engine)
  })

  e.sub(input$, runQuery)

  return [input$, output$] as const
}
