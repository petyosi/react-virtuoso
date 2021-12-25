describe('list with scroll seek placeholders', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:1234/collapsible-long-item')
    await page.waitForSelector('#test-root div')
    await page.waitForTimeout(100)
  })

  it('compensates correctly when collapsing an item', async () => {
    await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div')!
      scroller.scrollBy({ top: -400 })
    })

    await page.waitForTimeout(200)

    await page.evaluate(() => {
      const button = document.querySelector('[data-index="90"] button') as HTMLButtonElement
      button.click()
    })

    await page.waitForTimeout(200)

    const scrollTop = await page.evaluate(() => {
      const scroller = document.querySelector('#test-root > div')!
      return scroller.scrollTop
    })

    expect(scrollTop).toBe(9200)
  })
})
