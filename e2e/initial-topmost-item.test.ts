describe('jagged list with initial topmost item', () => {
  // the real position here would be 1500, but the calc is based on the
  // first item size, which is 20px
  it('scrolls to the correct position', async () => {
    await page.goto('http://localhost:1234/initial-topmost-item')
    await page.waitForTimeout(100)

    const scrollTop = await page.evaluate(() => {
      const listContainer = document.querySelector('#test-root > div')
      return listContainer!.scrollTop
    })

    expect(scrollTop).toBe(1200)

    const paddingTop = await page.evaluate(() => {
      const listContainer = document.querySelector('#test-root > div > div > div') as HTMLElement
      return listContainer!.style.paddingTop
    })

    expect(paddingTop).toBe('1200px')
  })

  it('sticks the item to the top', async () => {
    await page.goto('http://localhost:1234/initial-topmost-item')
    await page.waitForTimeout(100)

    const firstChildIndex = await page.evaluate(() => {
      const firstChild = document.querySelector('#test-root > div > div > div > div') as HTMLElement
      return firstChild.dataset['index']
    })

    expect(firstChildIndex).toBe('60')
  })
})
