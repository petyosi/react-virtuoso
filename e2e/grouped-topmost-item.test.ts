describe('jagged grouped list', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:1234/grouped-topmost-item')
  })

  beforeEach(async () => {
    await page.reload()
    await page.waitForTimeout(100)
  })

  it('puts the specified item below the group', async () => {
    // we pick the second item, the first should remain under the group header
    const stickyItemIndex = await page.evaluate(() => {
      const stickyItem = document.querySelector('#test-root > div > div:first-child > div > div:nth-child(2)') as HTMLElement
      return stickyItem.dataset['itemIndex']
    })

    expect(stickyItemIndex).toBe('10')
  })
})
