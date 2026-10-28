import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils.ts'

import type { Page } from '@playwright/test'

function offsetOfItem(page: Page, index: number) {
  return page.evaluate((index) => {
    const scroller = document.querySelector('[data-testid=virtuoso-scroller]')!
    const item = document.querySelector(`[data-item-index="${index}"]`)
    return item ? Math.round(item.getBoundingClientRect().top - scroller.getBoundingClientRect().top) : null
  }, index)
}

test.describe('smooth scrollToIndex shortly after another scrollToIndex', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'scroll-to-index-smooth-after-scroll-to-index')
    await page.waitForSelector('[data-testid=virtuoso-scroller]')
    await page.waitForTimeout(300)
  })

  test('a smooth scrollToIndex reaches its item', async ({ page }) => {
    await page.click('#smooth-80')
    await expect.poll(() => offsetOfItem(page, 80), { timeout: 10_000 }).toBe(0)
  })

  test('a smooth scrollToIndex started within 150 ms of a previous one reaches its item', async ({ page }) => {
    await page.click('#jump-then-smooth-80')
    await expect.poll(() => offsetOfItem(page, 80), { timeout: 10_000 }).toBe(0)
  })
})
