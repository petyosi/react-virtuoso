import startServer from './_server'

describe('list with hundred items', () => {
  let server: any
  beforeAll(async () => {
    server = await startServer('grid')
  })

  afterAll(async () => {
    await server.close()
  })

  it('renders 20 items', async () => {
    await page.goto('http://localhost:1234/')
    await page.waitForTimeout(100)
    const itemCount = await page.evaluate(() => {
      const listContainer = document.querySelector('#root > div > div > div')
      return listContainer!.childElementCount
    })
    expect(itemCount).toBe(20)
  })

  it('fills in the scroller', async () => {
    await page.goto('http://localhost:1234/')
    await page.waitForTimeout(100)
    const scrollHeight = await page.evaluate(() => {
      const scroller = document.querySelector('#root > div')
      return scroller!.scrollHeight
    })
    expect(scrollHeight).toBe(1625)
  })
})
