describe('list with hundred items', () => {
  it('renders only 10 items', async () => {
    await page.goto('http://localhost:1234/hello')
    await page.waitForSelector('#test-root')
    const itemCount = await page.evaluate(() => {
      const listContainer = document.querySelector('#test-root > div > div > div')
      return listContainer!.childElementCount
    })
    expect(itemCount).toBe(10)
  })

  it('fills in the scroller', async () => {
    await page.goto('http://localhost:1234/hello')
    await page.waitForTimeout(100)
    const scrollHeight = await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div')
      return scroller!.scrollHeight
    })
    expect(scrollHeight).toBe(100 * 30)
  })
})
