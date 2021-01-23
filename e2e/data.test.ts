describe('list with hundred items', () => {
  it('renders 10 items', async () => {
    await page.goto('http://localhost:1234/data')
    await page.waitForTimeout(100)
    const itemCount = await page.evaluate(() => {
      const listContainer = document.querySelector('#test-root > div > div > div > div')
      return listContainer!.childElementCount
    })
    expect(itemCount).toBe(10)
  })

  it('fills in the scroller', async () => {
    await page.goto('http://localhost:1234/data')
    await page.waitForTimeout(100)
    const scrollHeight = await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div > div')
      return scroller!.scrollHeight
    })
    expect(scrollHeight).toBe(100 * 30)
  })

  it('increases the items', async () => {
    await page.goto('http://localhost:1234/data')
    await page.waitForTimeout(100)
    await page.evaluate(() => {
      document.querySelector('button')!.click()
    })

    const scrollHeight = await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div > div')
      return scroller!.scrollHeight
    })

    expect(scrollHeight).toBe(120 * 30)
  })
})
