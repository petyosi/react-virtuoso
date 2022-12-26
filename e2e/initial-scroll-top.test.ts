import { test, expect } from '@playwright/test'
import { navigateToExample } from './utils'

test.describe('initial scroll top', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await navigateToExample(page, baseURL, 'initial-scroll-top')
  })

  test('starts from 50px', async ({ page }) => {
    const scrollTop = await page.evaluate(() => {
      const scroller = document.querySelectorAll('[data-test-id=virtuoso-scroller]')[0]
      return scroller.scrollTop
    })

    expect(scrollTop).toBe(50)
  })
})
