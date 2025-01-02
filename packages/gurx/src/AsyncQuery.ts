import { Pipe, type PipeRef } from './realm'

interface QueryLoadingResult {
  type: 'loading'
  isLoading: true
  data: null
  error: null
}

interface QuerySuccessResult<T> {
  type: 'success'
  isLoading: false
  data: T
  error: null
}

interface QueryErrorResult {
  type: 'error'
  isLoading: false
  data: null
  error: Error
}

type QueryResult<T> = QueryLoadingResult | QuerySuccessResult<T> | QueryErrorResult

const INITIAL_QUERY_RESULT: QueryLoadingResult = { type: 'loading', isLoading: true, data: null, error: null }

export function AsyncQuery<I, O>(query: (params: I) => Promise<O>, defaultParams: I): PipeRef<I, QueryResult<O>> {
  return Pipe(INITIAL_QUERY_RESULT as QueryResult<O>, (r, input$, output$) => {
    function runQuery(params: I) {
      r.pub(output$, INITIAL_QUERY_RESULT)
      query(params)
        .then((data) => {
          r.pub(output$, { type: 'success', isLoading: false, data, error: null })
        })
        .catch((error) => {
          r.pub(output$, { type: 'error', isLoading: false, data: null, error })
        })
    }
    runQuery(defaultParams)
    r.sub(input$, runQuery)
  })
}
