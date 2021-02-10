describe('jagged list with 2 top items', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:1234/top-items')
    await page.waitForSelector('#test-root > div')
    await page.waitForTimeout(100)
  })
  it('stays at top at start', async () => {
    const scrollTop = await page.evaluate(() => {
      const listContainer = document.querySelector('#test-root > div')
      return listContainer!.scrollTop
    })

    expect(scrollTop).toBe(0)

    const paddingTop = await page.evaluate(() => {
      const listContainer = document.querySelector('#test-root > div > div > div') as HTMLElement
      return listContainer.style.paddingTop
    })

    expect(paddingTop).toBe('70px')
  })

  it('renders correct amount of items', async () => {
    const childElementCount = await page.evaluate(() => {
      const listContainer = document.querySelectorAll('#test-root > div > div > div')[0]
      return listContainer.childElementCount
    })
    expect(childElementCount).toBe(9)
  })

  it('renders the full list correctly', async () => {
    await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div')
      scroller!.scrollTo({ top: 2000 })
    })

    await page.waitForTimeout(100)

    const firstChildIndex = await page.evaluate(() => {
      const firstChild = document.querySelector('#test-root > div > div > div > div') as HTMLElement
      return firstChild.dataset['index']
    })

    expect(firstChildIndex).toBe('85')
  })
})
