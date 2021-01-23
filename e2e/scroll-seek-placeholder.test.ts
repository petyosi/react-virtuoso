describe('list with scroll seek placeholders', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:1234/scroll-seek-placeholder')
    await page.waitForSelector('#test-root div')
    await page.waitForTimeout(100)
  })

  it('renders placeholders when scrolled', async () => {
    await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div') as HTMLElement
      setInterval(() => {
        scroller.scrollBy({ top: 30 })
      }, 10)
    })

    await page.waitForTimeout(200)

    const color = await page.evaluate(() => {
      const stickyItem = document.querySelector('#test-root > div > div:first-child > div > div') as HTMLElement
      return stickyItem.style.color
    })

    expect(color).toBe('red')
  })
})
