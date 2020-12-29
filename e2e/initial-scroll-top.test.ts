import 'expect-puppeteer'
import startServer from './_server'

describe('scroll to index', () => {
  let server: any
  beforeAll(async () => {
    server = await startServer('initial-scroll-top')
    await page.goto('http://localhost:1234/')
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await page.reload()
    await page.waitFor(200) // :(
  })

  it('scrolls to 50px', async () => {
    const scrollTop = await page.evaluate(() => {
      const listContainer = document.querySelectorAll('#root > div')[0]
      return listContainer!.scrollTop
    })

    expect(scrollTop).toBe(50)
  })
})
