import { expect, test } from '@playwright/test'

import { navigateToExample } from './utils.ts'

// Virtuoso tells mobile Safari by its user agent. There, a scroll set while the user scrolls would stop the momentum,
// so an item measured above the viewport is compensated with the list's margin, and once scrolling stops the margin
// goes into the scroll position.
const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

test.describe('list scrolled up in mobile Safari', () => {
  test.use({ userAgent: IPHONE_SAFARI })

  test.beforeEach(async ({ baseURL, page }) => {
    await navigateToExample(page, baseURL, 'mobile-safari-upward-scroll')
    await page.waitForTimeout(100)
  })

  test('takes the margin off in the same task as the scroll that replaces it', async ({ page }) => {
    const { margins, moves, scrolls } = await page.evaluate(
      () =>
        new Promise<{ margins: string[]; moves: string[]; scrolls: number }>((resolve) => {
          const scroller = document.querySelector<HTMLElement>('[data-testid=virtuoso-scroller]')!
          const list = scroller.querySelector<HTMLElement>('[data-testid=virtuoso-item-list]')!
          const middle = () => {
            const box = scroller.getBoundingClientRect()
            return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)!
          }

          // The browser may paint between tasks, so by the end of the task that scrolled, the margin the scroll
          // replaces has to be gone; a message posted now is handled once this task and its microtasks are done.
          const margins: string[] = []
          let scrolls = 0
          const scrollBy = scroller.scrollBy.bind(scroller)
          scroller.scrollBy = ((options: ScrollToOptions) => {
            scrolls++
            scrollBy(options)
            const channel = new MessageChannel()
            channel.port1.addEventListener('message', () => {
              if (!['', 'auto', '0px'].includes(list.style.marginTop)) {
                margins.push(`scrolled by ${options.top}px, the margin was still ${list.style.marginTop}`)
              }
            })
            channel.port1.start()
            channel.port2.postMessage(null)
          }) as HTMLElement['scrollBy']

          // Six momentum scrolls up, a frame at a time and slowing down, each followed by 400ms in which the item in
          // the middle of the viewport must not move from one frame to the next.
          const moves: string[] = []
          let gestures = 0
          let speed = 60
          let item: Element | null = null
          let top = 0
          let stillSince = 0
          const frame = (now: number) => {
            if (speed > 0.5) {
              scroller.scrollTop -= speed
              speed *= 0.97
            } else if (item === null) {
              item = middle()
              top = item.getBoundingClientRect().top
              stillSince = now
            } else {
              const offset = Math.round(item.getBoundingClientRect().top - top)
              if (offset !== 0) {
                moves.push(`${item.textContent} moved by ${offset}px`)
              }
              if (now - stillSince > 400) {
                gestures++
                if (gestures === 6) {
                  resolve({ margins, moves, scrolls })
                  return
                }
                speed = 60
                item = null
              }
            }
            requestAnimationFrame(frame)
          }
          requestAnimationFrame(frame)
        })
    )

    // The margin went into the scroll position at least once, so the checks above saw it.
    expect(scrolls).toBeGreaterThan(0)
    expect(margins).toEqual([])
    expect(moves).toEqual([])
  })
})
