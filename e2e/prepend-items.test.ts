describe('list with prependable items', () => {
  async function getScrollTop() {
    await page.waitForTimeout(100)
    return await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div > div')
      return scroller!.scrollTop
    })
  }

  it('keeps the location at where ', async () => {
    await page.goto('http://localhost:1234/prepend-items')

    expect(await getScrollTop()).toBe(0)

    await page.evaluate(() => {
      document.querySelector('button')!.click()
    })

    expect(await getScrollTop()).toBe(110) // 55x2

    await page.evaluate(() => {
      document.querySelector('button')!.click()
    })

    expect(await getScrollTop()).toBe(220)
  })
})
