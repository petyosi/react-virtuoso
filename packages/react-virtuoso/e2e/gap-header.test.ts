import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils.ts'

import type { Page } from '@playwright/test'

function scrollTop(page: Page) {
  return page.evaluate(() => document.querySelector('[data-testid=virtuoso-scroller]')!.scrollTop)
}

test.describe('list with gap and header', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'gap-header')
    await page.waitForTimeout(100)
    await page.click('#index-50')
    await page.waitForTimeout(300)
  })

  test('scrolls the first item to the top, hiding the header', async ({ page }) => {
    await page.click('#index-0')
    await page.waitForTimeout(300)
    expect(await scrollTop(page)).toBe(50)
  })

  test('scrolls the second item to the top', async ({ page }) => {
    await page.click('#index-1')
    await page.waitForTimeout(300)
    expect(await scrollTop(page)).toBe(50 + 30 + 10)
  })

  test('scrolls the first item into view, hiding the header', async ({ page }) => {
    await page.click('#into-view-0')
    await page.waitForTimeout(300)
    expect(await scrollTop(page)).toBe(50)
  })
})

test.describe('gap without a header', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'gap-header')
    await page.goto(`${baseURL}/?story=gap-header--example&noHeader`)
    await page.waitForSelector('[data-storyloaded]')
    await page.click('#index-50')
    await expect.poll(() => scrollTop(page)).toBe(2000)
  })

  test('preserves the saved position across five restores', async ({ page }) => {
    async function restore() {
      await page.click('#restore')
      await page.waitForTimeout(300)
      return scrollTop(page)
    }
    const positions = [await restore(), await restore(), await restore(), await restore(), await restore()]
    expect(positions).toEqual([2000, 2000, 2000, 2000, 2000])
  })

  test('honors an explicit offset for index zero', async ({ page }) => {
    await page.click('#offset-0')
    await expect.poll(() => scrollTop(page)).toBe(100)
  })
})
