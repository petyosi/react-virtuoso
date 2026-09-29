import { useCallback, useState } from 'react'

import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { PROMPT_COLUMN_BASE_WIDTHS, PROMPT_TABLE_WIDTHS, PromptListGrowTable } from '../../../_stories/column-grow.fixture'

import type { ColumnHeaderContainerProps } from '../../..'

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const scrollerSelector = '[data-testid=virtuoso-table-scroller]'

type PromptColumnWidths = Readonly<Record<keyof typeof PROMPT_COLUMN_BASE_WIDTHS, number>>

function totalBaseWidth(baseWidths: PromptColumnWidths) {
  return Object.values(baseWidths).reduce((sum, width) => sum + width, 0)
}

function expectedGrowWidths(viewportWidth: number, baseWidths: PromptColumnWidths): PromptColumnWidths {
  const totalBase = totalBaseWidth(baseWidths)
  if (viewportWidth <= totalBase) {
    return baseWidths
  }

  const extra = viewportWidth - totalBase
  return {
    ...baseWidths,
    name: baseWidths.name + extra / 4,
    description: baseWidths.description + (extra * 3) / 4,
  }
}

function header(container: HTMLElement, key: string) {
  const element = container.querySelector<HTMLElement>(`[data-table-element-role="column-header"][data-column-key="${key}"]`)
  if (!element) {
    throw new Error(`Missing column header ${key}.`)
  }
  return element
}

function headerWidth(container: HTMLElement, key: string) {
  return header(container, key).getBoundingClientRect().width
}

function sortIconEndMarker(container: HTMLElement, key: string) {
  const element = header(container, key).querySelector<HTMLElement>('[data-table-element-role="sort-icon-end-marker"]')
  if (!element) {
    throw new Error(`Missing sort icon marker for column header ${key}.`)
  }
  return element
}

async function waitForReady(container: HTMLElement) {
  await expect.poll(() => container.querySelector(readySelector)).not.toBeNull()
}

async function waitForAnimationFrames() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

function expectHeaderWidths(container: HTMLElement, expected: PromptColumnWidths) {
  expect(headerWidth(container, 'name')).toBeCloseTo(expected.name, 1)
  expect(headerWidth(container, 'description')).toBeCloseTo(expected.description, 1)
  expect(headerWidth(container, 'versions')).toBeCloseTo(expected.versions, 1)
  expect(headerWidth(container, 'labels')).toBeCloseTo(expected.labels, 1)
  expect(headerWidth(container, 'updated')).toBeCloseTo(expected.updated, 1)
  expect(headerWidth(container, 'actions')).toBeCloseTo(expected.actions, 1)
}

function ResizedPromptListWithWidthControl() {
  const [width, setWidth] = useState<number>(PROMPT_TABLE_WIDTHS.wide)

  return (
    <>
      <button data-testid="widen-table" onClick={() => setWidth(1_600)} type="button">
        Widen
      </button>
      <PromptListGrowTable resizeNameTo={420} width={width} />
    </>
  )
}

const MEASURED_HEADER_SELECTOR = '[data-table-element-role="column-header"] [data-column-key]'
// Consumer stylesheets that let the measured header fill its column, as a styled wrapper does when it
// wants the whole header to be one hover and click target.
const STRETCHED_HEADER_STYLES = {
  'flex-grow': `${MEASURED_HEADER_SELECTOR} { flex: 1 1 auto; }`,
  'a percentage width': `${MEASURED_HEADER_SELECTOR} { width: 100%; }`,
}
const FIXED_VERSIONS_HEADER_WIDTH = 200

function StretchedHeaderPromptList({ css, resizable = true }: { css: string; resizable?: boolean }) {
  const [width, setWidth] = useState<number>(PROMPT_TABLE_WIDTHS.wide)

  return (
    <>
      <style>{css}</style>
      <button data-testid="narrow-table" onClick={() => setWidth(PROMPT_TABLE_WIDTHS.narrow)} type="button">
        Narrow
      </button>
      <PromptListGrowTable resizable={resizable} width={width} />
    </>
  )
}

function InteractiveHeaderSurfacePromptList() {
  const [activatedColumn, setActivatedColumn] = useState('none')
  const headerContainerProps = useCallback(
    (columnKey: string): ColumnHeaderContainerProps => ({
      'data-testid': `header-surface-${columnKey}`,
      onClick: () => setActivatedColumn(columnKey),
      style: { backgroundColor: columnKey === 'name' ? 'rgb(219, 234, 254)' : undefined },
    }),
    []
  )

  return (
    <>
      <output data-testid="activated-column">{activatedColumn}</output>
      <PromptListGrowTable headerContainerProps={headerContainerProps} width={PROMPT_TABLE_WIDTHS.wide} />
    </>
  )
}

function DescriptionResizedPromptList() {
  const descriptionWidth = expectedGrowWidths(PROMPT_TABLE_WIDTHS.wide, PROMPT_COLUMN_BASE_WIDTHS).description + 100

  return <PromptListGrowTable resizeDescriptionTo={descriptionWidth} width={PROMPT_TABLE_WIDTHS.wide} />
}

describe('column grow layout', () => {
  test('wide prompt-list layout grows only text-heavy columns', async () => {
    const screen = await render(<PromptListGrowTable width={PROMPT_TABLE_WIDTHS.wide} />)

    await waitForReady(screen.container)
    await waitForAnimationFrames()

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const expected = expectedGrowWidths(scroller.clientWidth, PROMPT_COLUMN_BASE_WIDTHS)

    expectHeaderWidths(screen.container, expected)
  })

  test('wide prompt-list layout aligns header end slots to rendered column edges', async () => {
    const screen = await render(<PromptListGrowTable showSortIconBoundaries width={PROMPT_TABLE_WIDTHS.wide} />)

    await waitForReady(screen.container)
    await waitForAnimationFrames()

    for (const key of ['name', 'description', 'updated']) {
      const headerRect = header(screen.container, key).getBoundingClientRect()
      const markerRect = sortIconEndMarker(screen.container, key).getBoundingClientRect()

      expect(markerRect.right).toBeCloseTo(headerRect.right, 1)
    }
  })

  test('narrow prompt-list layout keeps base widths and scrolls horizontally', async () => {
    const screen = await render(<PromptListGrowTable width={PROMPT_TABLE_WIDTHS.narrow} />)

    await waitForReady(screen.container)
    await waitForAnimationFrames()

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement

    expect(scroller.clientWidth).toBeLessThan(totalBaseWidth(PROMPT_COLUMN_BASE_WIDTHS))
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth)
    expectHeaderWidths(screen.container, PROMPT_COLUMN_BASE_WIDTHS)
  })

  test.each(Object.entries(STRETCHED_HEADER_STYLES))(
    'a header stretched by %s gives its grow width back when the table narrows',
    async (_, css) => {
      const screen = await render(<StretchedHeaderPromptList css={css} />)

      await waitForReady(screen.container)
      await waitForAnimationFrames()

      const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
      expectHeaderWidths(screen.container, expectedGrowWidths(scroller.clientWidth, PROMPT_COLUMN_BASE_WIDTHS))

      const narrowButton = screen.container.querySelector('[data-testid="narrow-table"]') as HTMLButtonElement
      narrowButton.click()

      await expect.poll(() => headerWidth(screen.container, 'description')).toBeCloseTo(PROMPT_COLUMN_BASE_WIDTHS.description, 1)
      expectHeaderWidths(screen.container, PROMPT_COLUMN_BASE_WIDTHS)
    }
  )

  test('a percentage-width header without slots gives its grow width back when the table narrows', async () => {
    const screen = await render(<StretchedHeaderPromptList css={STRETCHED_HEADER_STYLES['a percentage width']} resizable={false} />)

    await waitForReady(screen.container)
    await waitForAnimationFrames()

    const narrowButton = screen.container.querySelector('[data-testid="narrow-table"]') as HTMLButtonElement
    narrowButton.click()

    await expect.poll(() => headerWidth(screen.container, 'description')).toBeCloseTo(PROMPT_COLUMN_BASE_WIDTHS.description, 1)
    expectHeaderWidths(screen.container, PROMPT_COLUMN_BASE_WIDTHS)
  })

  test('container props style and activate the full rendered header without changing its measured width', async () => {
    const screen = await render(<InteractiveHeaderSurfacePromptList />)

    await waitForReady(screen.container)
    await waitForAnimationFrames()

    const surface = screen.container.querySelector('[data-testid="header-surface-name"]') as HTMLElement
    const measureBoundary = surface.querySelector('[data-table-element-role="column-header-measure-boundary"]') as HTMLElement
    const surfaceRect = surface.getBoundingClientRect()
    const boundaryRect = measureBoundary.getBoundingClientRect()

    expect(surfaceRect.width).toBeGreaterThan(boundaryRect.width)
    expect(getComputedStyle(surface).backgroundColor).toBe('rgb(219, 234, 254)')

    const hitTarget = document.elementFromPoint(surfaceRect.right - 4, surfaceRect.top + surfaceRect.height / 2) as HTMLElement
    hitTarget.click()

    await expect.poll(() => screen.container.querySelector('[data-testid="activated-column"]')?.textContent).toBe('name')
  })

  test('a fixed width on the measured header still sets the base width', async () => {
    const css = `[data-table-element-role="column-header"] [data-column-key="versions"] { width: ${FIXED_VERSIONS_HEADER_WIDTH}px; }`
    const screen = await render(
      <>
        <style>{css}</style>
        <PromptListGrowTable resizable width={PROMPT_TABLE_WIDTHS.narrow} />
      </>
    )

    await waitForReady(screen.container)

    await expect.poll(() => headerWidth(screen.container, 'versions')).toBeCloseTo(FIXED_VERSIONS_HEADER_WIDTH, 1)
  })

  test('a minimum width on the measured header still sets the base width', async () => {
    const minimumWidth = FIXED_VERSIONS_HEADER_WIDTH + 24
    const css = `[data-table-element-role="column-header-measure"][data-column-key="versions"] { min-width: ${minimumWidth}px; }`
    const screen = await render(
      <>
        <style>{css}</style>
        <PromptListGrowTable width={PROMPT_TABLE_WIDTHS.narrow} />
      </>
    )

    await waitForReady(screen.container)

    await expect.poll(() => headerWidth(screen.container, 'versions')).toBeCloseTo(minimumWidth, 1)
  })

  test('a stretched header keeps its end slot aligned with the rendered column edge', async () => {
    const screen = await render(
      <>
        <style>{STRETCHED_HEADER_STYLES['a percentage width']}</style>
        <PromptListGrowTable showSortIconBoundaries width={PROMPT_TABLE_WIDTHS.wide} />
      </>
    )

    await waitForReady(screen.container)
    await waitForAnimationFrames()

    const headerRect = header(screen.container, 'description').getBoundingClientRect()
    const markerRect = sortIconEndMarker(screen.container, 'description').getBoundingClientRect()

    expect(markerRect.right).toBeCloseTo(headerRect.right, 1)
  })

  test('resized grow column keeps its rendered width and freezes sibling widths', async () => {
    const screen = await render(<ResizedPromptListWithWidthControl />)

    await waitForReady(screen.container)

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const initialExpected = expectedGrowWidths(scroller.clientWidth, PROMPT_COLUMN_BASE_WIDTHS)

    await expect.poll(() => headerWidth(screen.container, 'name')).toBeCloseTo(420, 1)

    expectHeaderWidths(screen.container, { ...initialExpected, name: 420 })

    const descriptionBeforeWidening = headerWidth(screen.container, 'description')
    const widenButton = screen.container.querySelector('[data-testid="widen-table"]') as HTMLButtonElement
    widenButton.click()

    await waitForAnimationFrames()

    expect(headerWidth(screen.container, 'description')).toBeCloseTo(descriptionBeforeWidening, 1)
    expect(headerWidth(screen.container, 'name')).toBeCloseTo(420, 1)
  })

  test('resizing the description boundary to the right creates horizontal overflow', async () => {
    const screen = await render(<DescriptionResizedPromptList />)

    await waitForReady(screen.container)
    await waitForAnimationFrames()

    const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
    const initialExpected = expectedGrowWidths(scroller.clientWidth, PROMPT_COLUMN_BASE_WIDTHS)
    const resizedDescriptionWidth = initialExpected.description + 100

    await expect.poll(() => headerWidth(screen.container, 'description')).toBeCloseTo(resizedDescriptionWidth, 1)
    expect(headerWidth(screen.container, 'name')).toBeCloseTo(initialExpected.name, 1)
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth)
  })
})
