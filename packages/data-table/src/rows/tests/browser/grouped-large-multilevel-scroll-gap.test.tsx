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
  stickyDepartmentId: string | null
  stickyDepartmentText: string | null
  stickyTeamId: string | null
  stickyTeamText: string | null
  firstVisibleEmployeeDepartmentId: string | null
  firstVisibleEmployeeTeamId: string | null
  firstVisibleEmployeeText: string | null
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
  const firstVisibleEmployee = rows
    .filter((row) => !row.group && row.rectBottom > stickyBottom && row.rectTop < scrollerRect.bottom)
    .toSorted((a, b) => a.rectTop - b.rectTop)[0]
  const employeeIds = firstVisibleEmployee ? employeeIdsFromRow(firstVisibleEmployee.text) : { departmentId: null, teamId: null }

  return {
    stickyDepartmentId: stickyDepartment ? departmentIdFromStickyHeader(stickyDepartment.text) : null,
    stickyDepartmentText: stickyDepartment?.text ?? null,
    stickyTeamId,
    stickyTeamText: stickyTeam?.text ?? null,
    firstVisibleEmployeeDepartmentId: employeeIds.departmentId,
    firstVisibleEmployeeTeamId: employeeIds.teamId,
    firstVisibleEmployeeText: firstVisibleEmployee?.text ?? null,
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

    expect(
      state.stickyDepartmentId,
      `At scrollTop ${target}, sticky department was "${state.stickyDepartmentText}" but the first visible employee row was "${state.firstVisibleEmployeeText}".`
    ).toBe(state.firstVisibleEmployeeDepartmentId)
  }
})

test('sticky team updates correctly through fine 10px scroll steps across a team boundary', async () => {
  const screen = await render(<LargeMultiLevelGrouping />)

  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()

  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  const startTarget = Math.floor(scroller.scrollHeight * 0.02)
  const endTarget = startTarget + 600
  const step = 10

  for (let target = startTarget; target <= endTarget; target += step) {
    scroller.scrollTop = target

    // oxlint-disable-next-line no-await-in-loop
    const state = await waitForStickyViewportState(screen.container, scroller, target)

    if (state.stickyTeamId !== state.firstVisibleEmployeeTeamId) {
      throw new Error(
        `At scrollTop ${target} (10px steps), sticky team was "${state.stickyTeamText}" but first visible employee was "${state.firstVisibleEmployeeText}".`
      )
    }
  }
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
