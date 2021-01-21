import startServer from './_server'

describe('list with hundred items', () => {
  let server: any
  beforeAll(async () => {
    server = await startServer('data')
  })

  afterAll(async () => {
    await server.close()
  })

  it('renders 10 items', async () => {
    await page.goto('http://localhost:1234/')
    await page.waitForTimeout(100)
    const itemCount = await page.evaluate(() => {
      const listContainer = document.querySelector('#root > div > div > div > div')
      return listContainer!.childElementCount
    })
    expect(itemCount).toBe(10)
  })

  it('fills in the scroller', async () => {
    await page.goto('http://localhost:1234/')
    await page.waitForTimeout(100)
    const scrollHeight = await page.evaluate(() => {
      const scroller = document.querySelector('#root > div > div')
      return scroller!.scrollHeight
    })
    expect(scrollHeight).toBe(100 * 30)
  })

  it('increases the items', async () => {
    await page.goto('http://localhost:1234/')
    await page.waitForTimeout(100)
    await page.evaluate(() => {
      document.querySelector('button')!.click()
    })

    const scrollHeight = await page.evaluate(() => {
      const scroller = document.querySelector('#root > div > div')
      return scroller!.scrollHeight
    })

    expect(scrollHeight).toBe(120 * 30)
  })
})
