import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils.ts'

import type { Page } from '@playwright/test'

async function remount(page: Page) {
  await page.click('#reload')
  await page.waitForTimeout(200)
  return page.evaluate(() => {
    const scroller = document.querySelector('[data-testid=virtuoso-scroller]')!
    const list = document.querySelector('[data-testid=virtuoso-item-list]')
    return { firstItem: list?.firstElementChild?.textContent, scrollTop: scroller.scrollTop }
  })
}

test.describe('grid with restored state', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'grid-state')
    await page.waitForTimeout(100)
  })

  test('keeps the scroll position across repeated remounts', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelector('[data-testid=virtuoso-scroller]')!.scrollTo({ top: 2000 })
    })
    await page.waitForTimeout(200)

    const expected = { firstItem: 'Item 100', scrollTop: 2000 }
    expect(await remount(page)).toEqual(expected)
    // the snapshot reported after the first restore is restored as well
    expect(await remount(page)).toEqual(expected)
    expect(await remount(page)).toEqual(expected)
  })
})
