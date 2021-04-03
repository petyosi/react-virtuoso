describe('list with hundred items', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:1234/long-last-item')
    await page.waitForSelector('#test-root')
    await page.waitForTimeout(300)
  })

  it('starts from the last item', async () => {
    const itemCount = await page.evaluate(() => {
      const listContainer = document.querySelector('#test-root > div > div > div')
      return (listContainer as HTMLElement).style.paddingTop
    })
    expect(itemCount).toBe('7200px')
  })

  it('compensates on upwards scrolling correctly', async () => {
    await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div')!
      scroller.scrollBy({ top: -2 })
    })

    await page.waitForTimeout(100)

    const scrollTop = await page.evaluate(() => {
      return document.querySelector('#test-root > div')!.scrollTop
    })

    // items are 800 and 100px tall.
    // scrolling up by 2px reveals an unexpectedly short item, so it should compensate
    expect(scrollTop).toBe(7200 - 2 - (800 - 100))
  })
})
