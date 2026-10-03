import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils.ts'

// Regression coverage for https://github.com/petyosi/react-virtuoso/issues/1242 --
// endReached never fired again if a filter operation brought the item count back
// down to a value it had already reported.
test.describe('grid endReached after filtering', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'grid-end-reached-after-filter')
    await page.waitForTimeout(100)
  })

  test('fires again after the data is replaced even if the item count returns to a previously reached value', async ({ page }) => {
    await expect(page.getByTestId('end-reached-count')).toHaveText('1')
    await expect(page.getByTestId('last-end-reached-index')).toHaveText('19')

    // Replace the data with a different (filtered) array of the same length. The last
    // endReached index reported (19) is identical to what this will report again, so a
    // naive distinctUntilChanged on the index alone would swallow this second call.
    await page.getByTestId('enable-filter').click()
    await page.waitForTimeout(100)
    await expect(page.getByTestId('end-reached-count')).toHaveText('2')
    await expect(page.getByTestId('last-end-reached-index')).toHaveText('19')
  })
})
