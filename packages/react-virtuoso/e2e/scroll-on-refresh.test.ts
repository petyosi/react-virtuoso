import { expect, test } from '@playwright/test'

//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('scroll on refresh', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'scroll-on-refresh')
    await page.reload()
    await page.waitForTimeout(100)
  })

  test('scrolls to 141 item', async ({ page }) => {
    await page.click('#add-and-scroll')

    await page.waitForTimeout(100)

    const firstChildIndex = await page.evaluate(() => {
      const firstChild = document.querySelector('[data-testid=virtuoso-item-list] > div') as HTMLElement
      return firstChild.dataset.index
    })
    expect(firstChildIndex).toBe('140')
  })
})