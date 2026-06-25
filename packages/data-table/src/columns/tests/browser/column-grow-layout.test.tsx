import { useState } from 'react'

import { expect, test, describe } from 'vitest'
import { render } from 'vitest-browser-react'

import { PROMPT_COLUMN_BASE_WIDTHS, PROMPT_TABLE_WIDTHS, PromptListGrowTable } from '../../../_stories/column-grow.fixture'

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
