import { Page } from '@playwright/test'

export async function navigateToExample(page: Page, baseURL: string | undefined, exampleName: string) {
  await page.goto(`${baseURL}/?story=${exampleName}--example`)
  return page.waitForSelector('[data-storyloaded]')
}
