import { Pipe, type PipeRef } from './realm'

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
  error: Error
  isLoading: false
  type: 'error'
}

type QueryResult<T> = QueryErrorResult | QueryLoadingResult | QuerySuccessResult<T>

const INITIAL_QUERY_RESULT: QueryLoadingResult = { data: null, error: null, isLoading: true, type: 'loading' }

export function AsyncQuery<I, O>(query: (params: I) => Promise<O>, defaultParams: I): PipeRef<I, QueryResult<O>> {
  return Pipe(INITIAL_QUERY_RESULT as QueryResult<O>, (r, input$, output$) => {
    function runQuery(params: I) {
      r.pub(output$, INITIAL_QUERY_RESULT)
      query(params)
        .then((data) => {
          r.pub(output$, { data, error: null, isLoading: false, type: 'success' })
        })
        .catch((error: unknown) => {
          r.pub(output$, { data: null, error, isLoading: false, type: 'error' })
        })
    }
    runQuery(defaultParams)
    r.sub(input$, runQuery)
  })
}
