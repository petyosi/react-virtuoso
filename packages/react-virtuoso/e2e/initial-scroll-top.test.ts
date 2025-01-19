import { test, expect } from '@playwright/test'
//@ts-expect-error - type module and playwright
import { navigateToExample } from './utils.ts'

test.describe('initial scroll top', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'initial-scroll-top')
  })

  test('starts from 50px', async ({ page }) => {
    await page.waitForTimeout(100)
    const scrollTop = await page.evaluate(() => {
      const scroller = document.querySelectorAll('[data-testid=virtuoso-scroller]')[0]
      return scroller.scrollTop
    })

    expect(scrollTop).toBe(50)
  })
})
