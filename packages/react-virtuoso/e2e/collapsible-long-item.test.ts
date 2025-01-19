import { test, expect } from '@playwright/test'
//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('list with collapsible long items', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'collapsible-long-item')
    await page.waitForSelector('[data-testid=virtuoso-scroller]')
    await page.waitForTimeout(200)
  })

  test('compensates correctly when collapsing an item', async ({ page }) => {
    await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid=virtuoso-scroller]')!
      scroller.scrollBy({ top: -400 })
    })

    await page.waitForTimeout(500)

    await page.evaluate(() => {
      const button = document.querySelector('[data-index="90"] button') as HTMLButtonElement
      button.click()
    })

    await page.waitForTimeout(200)

    const scrollTop = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid=virtuoso-scroller]')!
      return scroller.scrollTop
    })

    expect(scrollTop).toBe(9200)
  })
})
