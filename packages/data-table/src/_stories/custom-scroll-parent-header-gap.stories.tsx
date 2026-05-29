import * as React from 'react'
import type { CSSProperties } from 'react'

import { localModel } from '@virtuoso.dev/data-table'

import { DataTable, DataTableCell, DataTableColumn, DataTableColumnHeader } from '@/components/ui/data-table'

interface ProductRow {
  id: string
  name: string
  category: string
  region: string
  status: string
}

const ROW_HEIGHT = 34
const SCROLL_PARENT_HEIGHT = 420
const PRE_TABLE_HEADER_HEIGHT = 360
const TABLE_WIDTH = 760
const JUMP_ROW_INDEX = 58

const PRODUCTS: ProductRow[] = Array.from({ length: 180 }, (_, index) => ({
  id: `SKU-${String(index + 1).padStart(3, '0')}`,
  name: `Product ${index + 1}`,
  category: ['Office', 'Peripherals', 'Audio', 'Storage'][index % 4]!,
  region: ['US', 'EU', 'APAC'][index % 3]!,
  status: index % 7 === 0 ? 'Backorder' : index % 5 === 0 ? 'Low stock' : 'In stock',
}))

const STORY_STYLE: CSSProperties = {
  display: 'grid',
  gap: 12,
  maxWidth: TABLE_WIDTH,
  padding: 16,
}

const ACTION_BAR_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const BUTTON_STYLE: CSSProperties = {
  border: '1px solid #d4d4d8',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  padding: '6px 10px',
}

const SCROLL_PARENT_STYLE: CSSProperties = {
  border: '1px solid #d4d4d8',
  borderRadius: 8,
  height: SCROLL_PARENT_HEIGHT,
  overflow: 'auto',
  position: 'relative',
  width: TABLE_WIDTH,
}

const PRE_TABLE_HEADER_STYLE: CSSProperties = {
  alignContent: 'center',
  background: '#f4f4f5',
  borderBottom: '1px solid #d4d4d8',
  boxSizing: 'border-box',
  color: '#3f3f46',
  height: PRE_TABLE_HEADER_HEIGHT,
  padding: 16,
}

const CELL_CONTENT_STYLE: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  height: ROW_HEIGHT,
  minWidth: 0,
}

const TABLE_CLASS_NAME = 'min-w-[760px]'
const CELL_CLASS_NAME = 'p-0 px-2'

function useScrollParentControls(scrollParent: HTMLElement | null) {
  const [scrollTop, setScrollTop] = React.useState(0)

  React.useEffect(() => {
    if (!scrollParent) {
      setScrollTop(0)
      return
    }

    const update = () => {
      setScrollTop(Math.round(scrollParent.scrollTop))
    }

    update()
    scrollParent.addEventListener('scroll', update, { passive: true })
    return () => {
      scrollParent.removeEventListener('scroll', update)
    }
  }, [scrollParent])

  const setScrollParentTop = React.useCallback(
    (top: number) => {
      if (!scrollParent) {
        return
      }
      scrollParent.scrollTop = top
      setScrollTop(Math.round(scrollParent.scrollTop))
    },
    [scrollParent]
  )

  const jumpNearMiddle = React.useCallback(() => {
    setScrollParentTop(PRE_TABLE_HEADER_HEIGHT + ROW_HEIGHT * JUMP_ROW_INDEX)
  }, [setScrollParentTop])

  const stepUp = React.useCallback(() => {
    setScrollParentTop(Math.max(0, scrollTop - ROW_HEIGHT))
  }, [scrollTop, setScrollParentTop])

  const nudgeUp = React.useCallback(() => {
    setScrollParentTop(Math.max(0, scrollTop - Math.round(ROW_HEIGHT / 3)))
  }, [scrollTop, setScrollParentTop])

  return { jumpNearMiddle, nudgeUp, scrollTop, stepUp }
}

function ProductColumns({ withColumnHeaders }: { withColumnHeaders: boolean }) {
  return (
    <>
      <DataTableColumn field="id">
        {withColumnHeaders && <DataTableColumnHeader className="min-w-[110px]">SKU</DataTableColumnHeader>}
        <DataTableCell className={CELL_CLASS_NAME}>
          {({ cellValue }) => <div style={{ ...CELL_CONTENT_STYLE, width: 110 }}>{String(cellValue)}</div>}
        </DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="name">
        {withColumnHeaders && <DataTableColumnHeader className="min-w-[220px]">Product</DataTableColumnHeader>}
        <DataTableCell className={CELL_CLASS_NAME}>
          {({ cellValue }) => <div style={{ ...CELL_CONTENT_STYLE, width: 220, fontWeight: 500 }}>{String(cellValue)}</div>}
        </DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="category">
        {withColumnHeaders && <DataTableColumnHeader className="min-w-[160px]">Category</DataTableColumnHeader>}
        <DataTableCell className={CELL_CLASS_NAME}>
          {({ cellValue }) => <div style={{ ...CELL_CONTENT_STYLE, width: 160 }}>{String(cellValue)}</div>}
        </DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="region">
        {withColumnHeaders && <DataTableColumnHeader className="min-w-[130px]">Region</DataTableColumnHeader>}
        <DataTableCell className={CELL_CLASS_NAME}>
          {({ cellValue }) => <div style={{ ...CELL_CONTENT_STYLE, width: 130 }}>{String(cellValue)}</div>}
        </DataTableCell>
      </DataTableColumn>
      <DataTableColumn field="status">
        {withColumnHeaders && <DataTableColumnHeader className="min-w-[140px]">Status</DataTableColumnHeader>}
        <DataTableCell className={CELL_CLASS_NAME}>
          {({ cellValue }) => <div style={{ ...CELL_CONTENT_STYLE, width: 140 }}>{String(cellValue)}</div>}
        </DataTableCell>
      </DataTableColumn>
    </>
  )
}

function CustomScrollParentRepro({ withColumnHeaders }: { withColumnHeaders: boolean }) {
  const [scrollParent, setScrollParent] = React.useState<HTMLDivElement | null>(null)
  const model = React.useMemo(() => localModel<ProductRow>({ data: PRODUCTS }), [])
  const { jumpNearMiddle, nudgeUp, scrollTop, stepUp } = useScrollParentControls(scrollParent)

  return (
    <div style={STORY_STYLE}>
      <div style={ACTION_BAR_STYLE}>
        <button type="button" style={BUTTON_STYLE} onClick={jumpNearMiddle}>
          Jump near middle
        </button>
        <button type="button" style={BUTTON_STYLE} onClick={stepUp}>
          Step up one row
        </button>
        <button type="button" style={BUTTON_STYLE} onClick={nudgeUp}>
          Nudge up
        </button>
        <span style={{ alignSelf: 'center', color: '#52525b', fontSize: 13 }}>scrollTop: {scrollTop}px</span>
      </div>

      <div data-repro-role="scroll-parent" ref={setScrollParent} style={SCROLL_PARENT_STYLE}>
        <div data-repro-role="pre-table-header" style={PRE_TABLE_HEADER_STYLE}>
          <strong>{PRE_TABLE_HEADER_HEIGHT}px header before the table</strong>
          <div>Jump down, then step or nudge upward. The failing case shows a blank band before the top row catches up.</div>
        </div>

        <DataTable className={TABLE_CLASS_NAME} customScrollParent={scrollParent} model={model}>
          <ProductColumns withColumnHeaders={withColumnHeaders} />
        </DataTable>
      </div>
    </div>
  )
}

export function CustomScrollParentHeaderGapRepro() {
  return <CustomScrollParentRepro withColumnHeaders />
}

export function CustomScrollParentNoHeadersControl() {
  return <CustomScrollParentRepro withColumnHeaders={false} />
}
