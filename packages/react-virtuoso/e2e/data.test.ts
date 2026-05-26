import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils.ts'

test.describe('list with hundred items', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'data')
    await expect(page.locator('[data-testid=virtuoso-scroller]')).toBeVisible()
    await expect(page.locator('[data-testid=virtuoso-item-list]')).toBeVisible()
  })

  test('renders 10 items', async ({ page }) => {
    await expect(page.locator('[data-testid=virtuoso-item-list] > div')).toHaveCount(10)
  })

  test('fills in the scroller', async ({ page }) => {
    await expect.poll(() => page.locator('[data-testid=virtuoso-scroller]').evaluate((scroller) => scroller.scrollHeight)).toBe(100 * 30)
  })

  test('increases the items', async ({ page }) => {
    await page.getByRole('button', { name: 'Append 20 Items' }).click()

    await expect.poll(() => page.locator('[data-testid=virtuoso-scroller]').evaluate((scroller) => scroller.scrollHeight)).toBe(120 * 30)
  })
})
