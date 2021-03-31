describe('scroll to index', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:1234/scroll-to-index')
  })

  beforeEach(async () => {
    await page.reload()
    await page.waitForTimeout(100)
  })

  // the example below goes to 670, because the initial render
  // renders 7x30px items (jumping back to 6 visible afterwards)
  // so it goes to (30-7) * 20 + (7 * 30)
  it('scrolls to the top 30 item', async () => {
    await page.click('#start-30')

    await page.waitForTimeout(100)

    const scrollTop = await page.evaluate(() => {
      const listContainer = document.querySelectorAll('#test-root > div')[1]
      return listContainer.scrollTop
    })

    expect(scrollTop).toBe((30 - 7) * 20 + 7 * 30)
  })

  it('scrolls to the 30 item with 5 offset', async () => {
    await page.click('#offset-30')

    await page.waitForTimeout(100)

    const scrollTop = await page.evaluate(() => {
      const listContainer = document.querySelectorAll('#test-root > div')[1]
      return listContainer.scrollTop
    })

    expect(scrollTop).toBe((30 - 7) * 20 + 7 * 30 + 5)
  })

  it('scrolls to the mid 50 item', async () => {
    await page.click('#center-50')

    await page.waitForTimeout(100)

    const scrollTop = await page.evaluate(() => {
      const listContainer = document.querySelectorAll('#test-root > div')[1]
      return listContainer.scrollTop
    })
    const rendered30s = 11
    expect(scrollTop).toBe((50 - rendered30s) * 20 + rendered30s * 30 - 300 / 2 + 20 / 2)
  })

  it('scrolls to the end 99 item', async () => {
    await page.click('#end-99')

    await page.waitForTimeout(100)

    const scrollTop = await page.evaluate(() => {
      const listContainer = document.querySelectorAll('#test-root > div')[1]
      return listContainer.scrollTop
    })

    const rendered30s = 14
    expect(scrollTop).toBe((99 - rendered30s) * 20 + rendered30s * 30 - 300 + 30)
  })
})
