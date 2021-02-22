describe('initial scroll top', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:1234/initial-scroll-top')
  })

  beforeEach(async () => {
    await page.reload()
    await page.waitForTimeout(500) // :(
  })

  it('starts from 50px', async () => {
    const scrollTop = await page.evaluate(() => {
      const listContainer = document.querySelectorAll('#test-root > div')[0]
      return listContainer.scrollTop
    })

    expect(scrollTop).toBe(50)
  })
})
