describe('list with a long last item', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:1234/test-case-446')
    await page.waitForSelector('#test-root')
    await page.waitForTimeout(300)
  })

  // the float height was causing a load of item 9
  it('starts from item with index 10', async () => {
    const firstItemIndex = await page.evaluate(() => {
      const listContainer = document.querySelector('[data-test-id=virtuoso-item-list]')!
      return (listContainer as HTMLElement).firstElementChild!.getAttribute('data-item-index')
    })
    expect(firstItemIndex).toBe('10')
  })
})
