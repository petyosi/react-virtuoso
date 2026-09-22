import React from 'react'

import { useCellValue, usePublisher } from '@virtuoso.dev/reactive-engine-react'

import {
  Cell,
  Column,
  ColumnHeader,
  VirtuosoDataTable,
  defaultAppendViewportHandler,
  defaultOffsetViewportHandler,
  dispatchModelAction$,
  localModel,
  modelActionState$,
  remoteModel,
  scrollToRow$,
  useEngineRef,
  useRemoteCellValue,
  useRemotePublisher,
  viewportRange$,
} from '..'
import { delay } from '../tests/utils'

import type { CardComponentProps, DataModelHandle, LoadingComponentProps } from '..'
// oxlint-disable-next-line no-unassigned-import
import './card-mode.css'

interface Service {
  id: number
  name: string
  requests: number
  status: string
}
interface Query {
  filter: string
  descending: boolean
}
interface Context {
  model: DataModelHandle<Service>
}

const SERVICES: Service[] = Array.from({ length: 1000 }, (_, id) => ({
  id,
  name: `Service ${id}`,
  requests: (id * 137) % 10000,
  status: id % 3 ? 'Healthy' : 'Degraded',
}))

function ServiceCard({ data, index }: CardComponentProps<Service>) {
  return (
    <article>
      <strong>{data.name}</strong>
      <p>{data.status}</p>
      <p>{data.requests.toLocaleString()} requests</p>
      <small>Item index {index}</small>
    </article>
  )
}

function Operations() {
  const dispatch = usePublisher(dispatchModelAction$)
  const state = useCellValue(modelActionState$)
  return (
    <div className="card-demo-operations">
      <label>
        Filter{' '}
        <input
          value={String(state.filter?.payload ?? '')}
          onChange={(event) => dispatch({ action: 'filter', payload: event.target.value })}
          placeholder="Service name"
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={Boolean(state.sort?.payload)}
          onChange={(event) => dispatch({ action: 'sort', payload: event.target.checked })}
        />{' '}
        Descending ID
      </label>
    </div>
  )
}

function InitialLoading({ context, loadingState }: LoadingComponentProps<Context>) {
  if (loadingState.initial.status === 'idle') {
    return null
  }
  return (
    <div role="status">
      Initial: {loadingState.initial.errorMessage ?? 'Loading…'}{' '}
      <button onClick={() => context.model.send({ action: 'reload' })}>Retry</button>
    </div>
  )
}

function RefreshLoading({ context, loadingState }: LoadingComponentProps<Context>) {
  return (
    <div role="status" className="card-demo-loading">
      Refresh: {loadingState.refresh.errorMessage ?? 'Loading…'}{' '}
      <button onClick={() => context.model.send({ action: 'reload' })}>Retry</button>
    </div>
  )
}

function EndLoading({ context, loadingState }: LoadingComponentProps<Context>) {
  return (
    <div role="status">
      Next page: {loadingState.end.errorMessage ?? 'Loading…'}{' '}
      <button onClick={() => context.model.send({ action: 'loadMore' })}>Retry next page</button>
    </div>
  )
}

function Empty() {
  return <p>No services match. Clear the filter to recover.</p>
}
const components = {
  Card: ServiceCard,
  CardHeader: Operations,
  LoadingPlaceholder: InitialLoading,
  LoadingOverlay: RefreshLoading,
  LoadingFooter: EndLoading,
}

function createLocalModel() {
  return localModel<Service>({
    data: SERVICES,
    pipeline: ['filter', 'sort'],
    actions: {
      filter: {
        stage: 'filter',
        handler: ({ data, payload }: { data: Service[]; payload: unknown }) =>
          data.filter((service) => service.name.toLowerCase().includes(String(payload).toLowerCase())),
      },
      sort: {
        stage: 'sort',
        handler: ({ data, payload }: { data: Service[]; payload: unknown }) => (payload ? data.toSorted((a, b) => b.id - a.id) : data),
      },
    },
  })
}

function Demo({ model, scrolling = 'internal' }: { model: DataModelHandle<Service>; scrolling?: 'internal' | 'window' | 'custom' }) {
  const [mode, setMode] = React.useState<'card' | 'table'>('card')
  const [width, setWidth] = React.useState(760)
  const [cardHeight, setCardHeight] = React.useState(144)
  const [hidden, setHidden] = React.useState(false)
  const [parent, setParent] = React.useState<HTMLDivElement | null>(null)
  const engineRef = useEngineRef()
  const scrollTo = useRemotePublisher(scrollToRow$, engineRef)
  const range = useRemoteCellValue(viewportRange$, engineRef)
  const context = React.useMemo(() => ({ model }), [model])
  const props = scrolling === 'custom' ? { customScrollParent: parent } : scrolling === 'window' ? { useWindowScroll: true } : {}
  const table = (
    <VirtuosoDataTable<Service, Context>
      model={model}
      mode={mode}
      engineRef={engineRef}
      context={context}
      components={components}
      EmptyPlaceholder={Empty}
      cardListClassName="card-demo-list"
      cardItemClassName="card-demo-item"
      computeRowKey={({ data, index }) => ((data as Service).id < 0 ? `placeholder-${index}` : (data as Service).id)}
      style={{ height: scrolling === 'internal' ? 420 : undefined, '--card-demo-height': `${cardHeight}px` } as React.CSSProperties}
      {...props}
    >
      <Column field="name">
        <ColumnHeader>{() => <Operations />}</ColumnHeader>
        <Cell>{({ cellValue }) => <div className="card-demo-row">{String(cellValue)}</div>}</Cell>
      </Column>
      <Column field="requests">
        <ColumnHeader>{() => <div style={{ width: 160 }}>Requests</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div className="card-demo-row">{String(cellValue)}</div>}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
  return (
    <div className="card-demo">
      <p>
        Cards use a measured CSS grid. Table rows are 32px. Switching resets the view to its first item; sort and filter stay in the model.
      </p>
      <div className="card-demo-controls">
        <button onClick={() => setMode(mode === 'card' ? 'table' : 'card')}>Switch to {mode === 'card' ? 'table' : 'card'}</button>
        <button onClick={() => scrollTo({ index: 300, align: 'center' })}>Scroll to item 300</button>
        <button onClick={() => scrollTo({ index: 'LAST', align: 'end' })}>Scroll to last item</button>
        <label>
          Width <input type="range" min="240" max="1000" value={width} onChange={(event) => setWidth(Number(event.target.value))} />
        </label>
        <label>
          Card height{' '}
          <input type="range" min="128" max="240" value={cardHeight} onChange={(event) => setCardHeight(Number(event.target.value))} />
        </label>
        <label>
          <input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} /> Hide list
        </label>
        <output>Rendered item range: {range ? `${range.startIndex}–${range.endIndex}` : 'not measured'}</output>
      </div>
      <div style={{ width, maxWidth: '100%', display: hidden ? 'none' : undefined }}>
        {scrolling === 'custom' ? (
          <div ref={setParent} style={{ height: 420, overflow: 'auto' }}>
            <div style={{ height: 80 }}>Content before the list</div>
            {table}
          </div>
        ) : (
          table
        )}
      </div>
    </div>
  )
}

export function LocalSortFilterAndMeasurements() {
  const model = React.useMemo(createLocalModel, [])
  return <Demo model={model} />
}

export function WindowScrolling() {
  const model = React.useMemo(createLocalModel, [])
  return <Demo model={model} scrolling="window" />
}

export function CustomScrollParent() {
  const model = React.useMemo(createLocalModel, [])
  return <Demo model={model} scrolling="custom" />
}

function RemoteDemo({ append }: { append: boolean }) {
  const failNext = React.useRef(false)
  const [error, setError] = React.useState('')
  const model = React.useMemo(() => {
    const actions = {
      filter: { handler: ({ params, payload }: { params: Query; payload: unknown }) => ({ ...params, filter: String(payload) }) },
      sort: { handler: ({ params, payload }: { params: Query; payload: unknown }) => ({ ...params, descending: Boolean(payload) }) },
      reload: { handler: ({ params }: { params: Query }) => params },
    }
    const query = async (params: Query, signal: AbortSignal) => {
      await delay(700)
      signal.throwIfAborted()
      if (failNext.current) {
        failNext.current = false
        throw new Error('Simulated request failure')
      }
      setError('')
      const data = SERVICES.filter((service) => service.name.toLowerCase().includes(params.filter.toLowerCase()))
      return params.descending ? data.toReversed() : data
    }
    const shared = {
      initialParams: { filter: '', descending: false },
      pageSize: 30,
      actions,
      onError: (cause: Error) => setError(cause.message),
    }
    return append
      ? remoteModel<Service, Query>({
          ...shared,
          mode: 'append',
          onViewportChange: defaultAppendViewportHandler,
          fetch: async ({ cursor, limit, params, signal }) => {
            const data = await query(params, signal)
            const start = Number(cursor ?? 0)
            return { rows: data.slice(start, start + limit), cursor: start + limit, hasMore: start + limit < data.length }
          },
        })
      : remoteModel<Service, Query>({
          ...shared,
          placeholder: { id: -1, name: 'Loading service…', requests: 0, status: 'Pending' },
          onViewportChange: defaultOffsetViewportHandler,
          fetch: async ({ offset, limit, params, signal }) => {
            const data = await query(params, signal)
            return { rows: data.slice(offset, offset + limit), totalCount: data.length }
          },
        })
  }, [append])
  return (
    <>
      <p>
        Requests take 700ms. Switch modes while loading. Arm a failure, then refresh or scroll to another page. Errors remain visible until
        retry succeeds.
      </p>
      <div className="card-demo-controls">
        <button
          onClick={() => {
            failNext.current = true
          }}
        >
          Fail next request
        </button>
        <button onClick={() => model.send({ action: 'reload' })}>Refresh / retry query</button>
        {append && <button onClick={() => model.send({ action: 'loadMore' })}>Load / retry next page</button>}
        {error && <span role="alert">{error}</span>}
      </div>
      <Demo model={model} />
    </>
  )
}

export function RemoteOffsetLoadingAndRetry() {
  return <RemoteDemo append={false} />
}
export function RemoteAppendLoadingAndRetry() {
  return <RemoteDemo append />
}

export function UnsupportedConfigurationRecovery() {
  const [grouped, setGrouped] = React.useState(false)
  const [missing, setMissing] = React.useState(false)
  const model = React.useMemo(createLocalModel, [])
  React.useEffect(() => {
    model.setData?.(SERVICES, grouped ? [{ index: 0, level: 0 }] : [])
  }, [model, grouped])
  return (
    <div className="card-demo">
      <p>Card mode rejects grouped data and a missing Card component. Clear either checkbox to recover.</p>
      <label>
        <input type="checkbox" checked={grouped} onChange={(event) => setGrouped(event.target.checked)} /> Grouped data
      </label>
      <label>
        <input type="checkbox" checked={missing} onChange={(event) => setMissing(event.target.checked)} /> Missing Card
      </label>
      <VirtuosoDataTable
        model={model}
        mode="card"
        components={missing ? {} : { Card: ServiceCard }}
        cardListClassName="card-demo-list"
        cardItemClassName="card-demo-item"
        style={{ height: 420 }}
      />
    </div>
  )
}
