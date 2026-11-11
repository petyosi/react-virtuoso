import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'

async function remount(page: Page) {
  // remount at the top of the page, so that the restore has to scroll the window.
  // Both happen before the scroll event, so the old grid does not report the top position.
  await page.evaluate(() => {
    window.scrollTo({ top: 0 })
    document.querySelector<HTMLButtonElement>('#reload')!.click()
  })
  await page.waitForTimeout(200)
  return page.evaluate(() => {
    const list = document.querySelector('[data-testid=virtuoso-item-list]')
    return { firstItem: list?.firstElementChild?.textContent, scrollY: window.scrollY }
  })
}

test.describe('window scroller grid with restored state', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    // use preview mode so the window is the scroll container
    await page.goto(`${baseURL}/?story=grid-window-state--example&mode=preview`)
    await page.waitForSelector('[data-storyloaded]')
    await page.waitForTimeout(100)
  })

  test('restores the window scroll position across repeated remounts', async ({ page }) => {
    // scroll the list 2000px down, past the content above it
    const scrollY = await page.evaluate(() => {
      const list = document.querySelector('[data-testid=virtuoso-item-list]')!
      const top = Math.round(list.getBoundingClientRect().top) + 2000
      window.scrollTo({ top })
      return top
    })
    await page.waitForTimeout(200)

    const expected = { firstItem: 'Item 100', scrollY }
    expect(await remount(page)).toEqual(expected)
    expect(await remount(page)).toEqual(expected)
  })
})
