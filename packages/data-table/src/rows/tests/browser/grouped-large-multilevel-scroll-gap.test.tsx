/**
 * @module-tag slow
 */
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { LargeMultiLevelGrouping } from '../../../_stories/grouped-data.stories'

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const rowSelector = '[data-testid=virtuoso-table-row]'
const scrollerSelector = '[data-testid=virtuoso-table-scroller]'

interface RowSnapshot {
  top: number
  height: number
  sticky: boolean
  text: string
}

interface StickyViewportState {
  stickyBottom: number
  stickyDepartmentId: string | null
  stickyDepartmentText: string | null
  stickyTeamId: string | null
  stickyTeamText: string | null
  firstVisibleInlineRowIsGroup: boolean
  firstVisibleInlineRowText: string | null
  firstVisibleEmployeeDepartmentId: string | null
  firstVisibleEmployeeTeamId: string | null
  firstVisibleEmployeeText: string | null
  firstVisibleStickyTeamEmployeeTop: number | null
  firstVisibleStickyTeamEmployeeText: string | null
}

function readRows(container: HTMLElement): RowSnapshot[] {
  return [...container.querySelectorAll(rowSelector)].map((row) => {
    const element = row as HTMLElement
    return {
      top: Number.parseFloat(element.style.top),
      height: Number.parseFloat(element.dataset.knownSize ?? '0'),
      sticky: element.style.position === 'sticky',
      text: (element.textContent ?? '').replaceAll(/\s+/g, ' ').trim(),
    }
  })
}

function visibleGapAfterSticky(container: HTMLElement, scrollTop: number, viewportHeight: number) {
  const rows = readRows(container)

  const stickyBottom = rows
    .filter((row) => row.sticky)
    .map((row) => row.top + row.height)
    .reduce((max, bottom) => Math.max(max, bottom), 0)

  const firstNonSticky = rows
    .filter((row) => !row.sticky && row.height > 0)
    .map((row) => ({ ...row, visualTop: row.top - scrollTop }))
    .filter((row) => row.visualTop + row.height > 0 && row.visualTop < viewportHeight)
    .toSorted((a, b) => a.visualTop - b.visualTop)[0]

  if (!firstNonSticky) {
    return { gap: 0, stickyBottom, firstRow: '' }
  }

  return {
    gap: firstNonSticky.visualTop - stickyBottom,
    stickyBottom,
    firstRow: firstNonSticky.text,
  }
}

function teamIdFromStickyHeader(text: string) {
  return /Team (\d+-\d+)/.exec(text)?.[1] ?? null
}

function departmentIdFromStickyHeader(text: string) {
  return /Department (\d+)/.exec(text)?.[1] ?? null
}

function employeeIdsFromRow(text: string) {
  const match = /Employee (\d+)-(\d+)-\d+/.exec(text)

  if (!match) {
    return {
      departmentId: null,
      teamId: null,
    }
  }

  return {
    departmentId: match[1] ?? null,
    teamId: `${match[1]}-${match[2]}`,
  }
}

function readStickyViewportState(container: HTMLElement, scroller: HTMLElement): StickyViewportState {
  const scrollerRect = scroller.getBoundingClientRect()
  const rows = [...container.querySelectorAll(rowSelector)].map((row) => {
    const element = row as HTMLElement
    return {
      group: 'groupRow' in element.dataset,
      sticky: element.style.position === 'sticky',
      text: (element.textContent ?? '').replaceAll(/\s+/g, ' ').trim(),
      rectTop: element.getBoundingClientRect().top,
      rectBottom: element.getBoundingClientRect().bottom,
    }
  })

  const stickyBottom = rows.filter((row) => row.sticky).reduce((max, row) => Math.max(max, row.rectBottom), scrollerRect.top)

  const stickyDepartment = rows.find((row) => row.group && row.sticky && row.text.startsWith('Department '))
  const stickyTeam = rows.find((row) => row.group && row.sticky && row.text.startsWith('Team '))
  const stickyTeamId = stickyTeam ? teamIdFromStickyHeader(stickyTeam.text) : null
  const visibleRows = rows
    .filter((row) => row.rectBottom > stickyBottom && row.rectTop < scrollerRect.bottom)
    .toSorted((a, b) => a.rectTop - b.rectTop)
  const firstVisibleInlineRow = visibleRows[0]
  const firstVisibleEmployee = visibleRows.find((row) => !row.group)
  const firstVisibleStickyTeamEmployee =
    stickyTeamId === null ? undefined : visibleRows.find((row) => !row.group && employeeIdsFromRow(row.text).teamId === stickyTeamId)
  const employeeIds = firstVisibleEmployee ? employeeIdsFromRow(firstVisibleEmployee.text) : { departmentId: null, teamId: null }

  return {
    stickyBottom,
    stickyDepartmentId: stickyDepartment ? departmentIdFromStickyHeader(stickyDepartment.text) : null,
    stickyDepartmentText: stickyDepartment?.text ?? null,
    stickyTeamId,
    stickyTeamText: stickyTeam?.text ?? null,
    firstVisibleInlineRowIsGroup: firstVisibleInlineRow?.group ?? false,
    firstVisibleInlineRowText: firstVisibleInlineRow?.text ?? null,
    firstVisibleEmployeeDepartmentId: employeeIds.departmentId,
    firstVisibleEmployeeTeamId: employeeIds.teamId,
    firstVisibleEmployeeText: firstVisibleEmployee?.text ?? null,
    firstVisibleStickyTeamEmployeeTop: firstVisibleStickyTeamEmployee?.rectTop ?? null,
    firstVisibleStickyTeamEmployeeText: firstVisibleStickyTeamEmployee?.text ?? null,
  }
}

function buildDeepScrollTargets(scroller: HTMLElement) {
  const rangeStart = Math.floor(scroller.scrollHeight * 0.015)
  const rangeEnd = Math.floor(scroller.scrollHeight * 0.03)
  const step = 120
  const targets: number[] = []

  for (let target = rangeStart; target <= rangeEnd; target += step) {
    targets.push(target)
  }

  return targets
}

async function waitForStickyViewportState(container: HTMLElement, scroller: HTMLElement, target: number) {
  let state: StickyViewportState | null = null

  scroller.scrollTop = target

  await expect
    .poll(() => {
      state = readStickyViewportState(container, scroller)

      return (
        Math.round(scroller.scrollTop) === target &&
        state.stickyDepartmentId !== null &&
        state.stickyTeamId !== null &&
        state.firstVisibleEmployeeDepartmentId !== null &&
        state.firstVisibleEmployeeTeamId !== null
      )
    })
    .toBe(true)

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
  state = readStickyViewportState(container, scroller)

  return state
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

async function findInlineRowTop(container: HTMLElement, scroller: HTMLElement, rowText: string, estimatedOffset: number) {
  const viewportHeight = scroller.clientHeight
  const maxScrollTop = Math.max(0, scroller.scrollHeight - viewportHeight)
  const scanRadius = Math.max(6000, viewportHeight * 12)
  const step = Math.max(80, Math.floor(viewportHeight / 2))
  const seenTargets = new Set<number>()
  const targets: number[] = []

  for (let delta = 0; delta <= scanRadius; delta += step) {
    targets.push(estimatedOffset - delta)
    targets.push(estimatedOffset + delta)
  }

  for (const rawTarget of targets) {
    const target = Math.max(0, Math.min(maxScrollTop, Math.round(rawTarget)))
    if (seenTargets.has(target)) {
      continue
    }
    seenTargets.add(target)

    scroller.scrollTop = target

    // oxlint-disable-next-line no-await-in-loop
    await expect.poll(() => Math.round(scroller.scrollTop)).toBe(target)
    // oxlint-disable-next-line no-await-in-loop
    await waitForAnimationFrames()

    const row = readRows(container).find((candidate) => !candidate.sticky && candidate.text === rowText)
    if (row) {
      return row.top
    }
  }

  throw new Error(`Could not find inline row "${rowText}" near estimated scrollTop ${estimatedOffset}.`)
}

test('large multi-level grouped scrolling does not open viewport gap below sticky headers', async () => {
  const screen = await render(<LargeMultiLevelGrouping />)

  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()

  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  const viewportHeight = scroller.clientHeight

  await expect.poll(() => visibleGapAfterSticky(screen.container, scroller.scrollTop, viewportHeight).gap).toBeLessThanOrEqual(120)

  const stressTargets = [
    ...Array.from({ length: 35 }, (_, i) => 80 + i * 80),
    ...Array.from({ length: 20 }, (_, i) => 2600 - i * 120),
    ...Array.from({ length: 18 }, (_, i) => i * 140),
  ]

  for (const target of stressTargets) {
    scroller.scrollTop = target
    scroller.dispatchEvent(new Event('scroll'))

    // oxlint-disable-next-line no-await-in-loop
    await expect
      .poll(() => {
        const { gap } = visibleGapAfterSticky(screen.container, scroller.scrollTop, viewportHeight)
        return gap
      })
      .toBeLessThanOrEqual(120)
  }
})

test('large multi-level grouped scrolling keeps the sticky team in sync with the visible employee rows', async () => {
  const screen = await render(<LargeMultiLevelGrouping />)

  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()

  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  const targets = buildDeepScrollTargets(scroller)

  for (const target of targets) {
    // oxlint-disable-next-line no-await-in-loop
    const state = await waitForStickyViewportState(screen.container, scroller, target)

    if (state.firstVisibleInlineRowIsGroup) {
      continue
    }

    if (state.stickyTeamId !== state.firstVisibleEmployeeTeamId) {
      throw new Error(
        `At scrollTop ${target}, sticky team was "${state.stickyTeamText}" but the first visible employee row was "${state.firstVisibleEmployeeText}".`
      )
    }
  }
})

test('large multi-level grouped scrolling keeps the sticky team in sync when scrolling back upward', async () => {
  const screen = await render(<LargeMultiLevelGrouping />)

  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()

  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  const targets = buildDeepScrollTargets(scroller).toReversed()

  for (const target of targets) {
    // oxlint-disable-next-line no-await-in-loop
    const state = await waitForStickyViewportState(screen.container, scroller, target)

    if (state.firstVisibleInlineRowIsGroup) {
      continue
    }

    if (state.stickyTeamId !== state.firstVisibleEmployeeTeamId) {
      throw new Error(
        `At scrollTop ${target} while scrolling upward, sticky team was "${state.stickyTeamText}" but the first visible employee row was "${state.firstVisibleEmployeeText}".`
      )
    }
  }
})

test('large multi-level grouped scrolling keeps the sticky department in sync with the visible employee rows', async () => {
  const screen = await render(<LargeMultiLevelGrouping />)

  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()

  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  const targets = buildDeepScrollTargets(scroller)

  for (const target of targets) {
    // oxlint-disable-next-line no-await-in-loop
    const state = await waitForStickyViewportState(screen.container, scroller, target)

    if (state.firstVisibleInlineRowIsGroup) {
      continue
    }

    expect(
      state.stickyDepartmentId,
      `At scrollTop ${target}, sticky department was "${state.stickyDepartmentText}" but the first visible employee row was "${state.firstVisibleEmployeeText}".`
    ).toBe(state.firstVisibleEmployeeDepartmentId)
  }
})

test('next team header does not become sticky before its team content reaches the sticky stack', async () => {
  const screen = await render(<LargeMultiLevelGrouping />)

  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()

  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  const team27HeaderIndex = 311 + 1 + 6 * 31
  const estimatedBoundaryOffset = Math.floor(scroller.scrollHeight * (team27HeaderIndex / 31_100))
  const team27HeaderOffset = await findInlineRowTop(screen.container, scroller, 'Team 2-7', estimatedBoundaryOffset)
  const startTarget = Math.max(0, team27HeaderOffset - 300)
  const endTarget = team27HeaderOffset + 200
  const step = 5
  let seenTeam26 = false

  for (let target = startTarget; target <= endTarget; target += step) {
    // oxlint-disable-next-line no-await-in-loop
    const state = await waitForStickyViewportState(screen.container, scroller, target)

    if (state.stickyTeamId === '2-6') {
      seenTeam26 = true
      continue
    }

    if (!seenTeam26 || state.stickyTeamId !== '2-7') {
      continue
    }

    expect(
      state.firstVisibleStickyTeamEmployeeTop,
      `At scrollTop ${target}, sticky team switched to "${state.stickyTeamText}" before its team content was visible below the sticky stack.`
    ).not.toBeNull()
    expect(
      state.firstVisibleStickyTeamEmployeeTop!,
      `At scrollTop ${target}, sticky team was "${state.stickyTeamText}" but its first visible employee row was "${state.firstVisibleStickyTeamEmployeeText}".`
    ).toBeLessThanOrEqual(state.stickyBottom + 1)

    return
  }

  throw new Error(
    `Did not observe the Team 2-6 -> Team 2-7 sticky handoff between scrollTop ${startTarget} and ${endTarget}. Team 2-7 inline offset was ${team27HeaderOffset}.`
  )
})

test('rapid scroll direction reversal keeps sticky team in sync', async () => {
  const screen = await render(<LargeMultiLevelGrouping />)

  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()

  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  const midpoint = Math.floor(scroller.scrollHeight * 0.025)

  const targets: number[] = []
  let pos = midpoint - 400
  for (let i = 0; i < 10; i++) {
    pos += 200
    targets.push(pos)
    pos -= 100
    targets.push(pos)
  }

  for (const target of targets) {
    // oxlint-disable-next-line no-await-in-loop
    const state = await waitForStickyViewportState(screen.container, scroller, target)

    if (state.firstVisibleInlineRowIsGroup) {
      continue
    }

    if (state.stickyTeamId !== state.firstVisibleEmployeeTeamId) {
      throw new Error(
        `At scrollTop ${target} (zigzag), sticky team was "${state.stickyTeamText}" but first visible employee was "${state.firstVisibleEmployeeText}".`
      )
    }
  }
})

test('sticky department and team update correctly across a department boundary', async () => {
  const screen = await render(<LargeMultiLevelGrouping />)

  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()

  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement

  // Each department has 311 items. Target the Dept 1 -> Dept 2 boundary region.
  // Dept 2 starts at index 311. Estimate its offset as scrollHeight * (311 / 31100).
  const dept2EstimatedOffset = Math.floor(scroller.scrollHeight * (311 / 31_100))
  const startTarget = Math.max(0, dept2EstimatedOffset - 300)
  const endTarget = dept2EstimatedOffset + 300
  const step = 40

  for (let target = startTarget; target <= endTarget; target += step) {
    scroller.scrollTop = target

    // oxlint-disable-next-line no-await-in-loop
    const state = await waitForStickyViewportState(screen.container, scroller, target)

    if (state.firstVisibleInlineRowIsGroup) {
      continue
    }

    expect(
      state.stickyDepartmentId,
      `At scrollTop ${target} (dept boundary), sticky department was "${state.stickyDepartmentText}" but first visible employee was "${state.firstVisibleEmployeeText}".`
    ).toBe(state.firstVisibleEmployeeDepartmentId)

    if (state.stickyTeamId !== state.firstVisibleEmployeeTeamId) {
      throw new Error(
        `At scrollTop ${target} (dept boundary), sticky team was "${state.stickyTeamText}" but first visible employee was "${state.firstVisibleEmployeeText}".`
      )
    }
  }
})
