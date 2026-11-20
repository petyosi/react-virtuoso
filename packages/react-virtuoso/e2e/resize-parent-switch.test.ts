import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils'

test('a resize queued by the previous scroll parent does not change scrollToIndex alignment', async ({ baseURL, page }) => {
  await navigateToExample(page, baseURL, 'resize-parent-switch')
  await page.waitForSelector('[data-index="15"]')
  await page.getByRole('button', { name: 'Switch parent and scroll to row 20' }).click()
  await expect(page.locator('#switch-complete')).toHaveText('true')

  await expect.poll(() => page.locator('#inner-scroll-parent').evaluate((element) => element.scrollTop)).toBe(550)
  await expect
    .poll(() =>
      page.evaluate(() => {
        const parent = document.querySelector('#inner-scroll-parent')!
        const row = parent.querySelector('[data-index="20"]')
        return row ? row.getBoundingClientRect().top - parent.getBoundingClientRect().top : null
      })
    )
    .toBe(0)
})
