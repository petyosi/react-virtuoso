import 'expect-puppeteer'
import startServer from './_server'

describe('jagged grouped list', () => {
  let server: any
  beforeAll(async () => {
    server = await startServer('grouped')
    await page.goto('http://localhost:1234/')
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await page.reload()
    await page.waitFor(100)
  })

  it('renders correct sizing', async () => {
    const [paddingTop, paddingBottom] = await page.evaluate(() => {
      const listContainer = document.querySelector('#root > div > div > div:first-child') as HTMLElement
      return [listContainer!.style.paddingTop, listContainer!.style.paddingBottom]
    })

    expect(paddingTop).toBe('30px')
    expect(paddingBottom).toBe('1500px')
  })

  it('renders correct state when scrolled', async () => {
    await page.evaluate(() => {
      const scroller = document.querySelector('#root > div') as HTMLElement
      scroller.scrollTo({ top: 500 })
    })

    await page.waitFor(100)

    const stickyItemIndex = await page.evaluate(() => {
      const stickyItem = document.querySelector('#root > div > div:last-child > div > div') as HTMLElement
      return stickyItem.dataset['index']
    })

    expect(stickyItemIndex).toBe('20')
  })
})
