import 'expect-puppeteer'
import startServer from './_server'

jest.setTimeout(1000000)

describe('jagged grouped list', () => {
  let server: any
  beforeAll(async () => {
    server = await startServer('grouped-topmost-item')
    await page.goto('http://localhost:1234/')
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await page.reload()
    await page.waitFor(100)
  })

  it('puts the specified item below the group', async () => {
    // we pick the second item, the first should remain under the group header
    const stickyItemIndex = await page.evaluate(() => {
      const stickyItem = document.querySelector('#root > div > div:first-child > div > div:nth-child(2)') as HTMLElement
      return stickyItem.dataset['itemIndex']
    })

    expect(stickyItemIndex).toBe('10')
  })
})
