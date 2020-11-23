import 'expect-puppeteer'
import startServer from './_server'

describe('list with scroll seek placeholders', () => {
  let server: any
  beforeAll(async () => {
    server = await startServer('scroll-seek-placeholder')
    await page.goto('http://localhost:1234/')
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await page.reload()
    await page.waitFor(100)
  })

  it('renders placeholders when scrolled', async () => {
    await page.evaluate(() => {
      const scroller = document.querySelector('#root > div') as HTMLElement
      setInterval(() => {
        scroller.scrollBy({ top: 30 })
      }, 10)
    })

    await page.waitFor(200)

    const color = await page.evaluate(() => {
      const stickyItem = document.querySelector('#root > div > div:first-child > div > div') as HTMLElement
      return stickyItem.style.color
    })

    expect(color).toBe('red')
  })
})
