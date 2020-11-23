import 'expect-puppeteer'
import startServer from './_server'

describe('list with prependable items', () => {
  let server: any
  beforeAll(async () => {
    server = await startServer('prepend-items')
  })

  afterAll(async () => {
    await server.close()
  })

  async function getScrollTop() {
    await page.waitFor(100)
    return await page.evaluate(() => {
      const scroller = document.querySelector('#root > div > div')
      return scroller!.scrollTop
    })
  }

  it('keeps the location at where ', async () => {
    await page.goto('http://localhost:1234/')

    expect(await getScrollTop()).toBe(0)

    await page.evaluate(() => {
      document.querySelector('button')!.click()
    })

    expect(await getScrollTop()).toBe(75)

    await page.evaluate(() => {
      document.querySelector('button')!.click()
    })

    expect(await getScrollTop()).toBe(150)
  })
})
