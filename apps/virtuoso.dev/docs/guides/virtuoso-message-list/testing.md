---
id: virtuoso-message-list-testing
title: Virtuoso Message List Testing
sidebar_label: Testing
sidebar_position: 9
slug: /virtuoso-message-list/testing
---

# Testing

The recommended way to test the Virtuoso Message List is through an end to end testing library like [Playwright](https://playwright.dev/). Playwright allows you to interact with the list as a user would, scrolling, clicking, and verifying the content.

## Testing with React Testing Library

Testing the Virtuoso Message List with React Testing Library is also possible, but it requires a bit more setup and is not as thorough/reliable as end-to-end testing. The simulated browser environment in JSDOM does not support measurement of scroll position and resize observer events. To work around this limitation, use the `VirtuosoMessageListTestingContext` component to stub the resize observer measurements.

```tsx
import { describe, it, beforeEach, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VirtuosoMessageListTestingContext, VirtuosoMessageListLicense, VirtuosoMessageList } from '@virtuoso.dev/message-list

function SampleComponent() {
  return (
    <VirtuosoMessageListTestingContext.Provider value={{ itemHeight: 100, viewportHeight: 400 }}>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList
          style={{ height: '100%' }}
          data={{ data: Array.from({ length: 100 })}}
          ItemContent={({ index }) => <div role="item">{index}</div>}
        />
      </VirtuosoMessageListLicense>
    </VirtuosoMessageListTestingContext.Provider>
  )
}

describe('dom test', () => {
  beforeEach(async () => {
    const ResizeObserver = await import('resize-observer-polyfill')
    global.ResizeObserver = ResizeObserver.default
  })

  it('works', async () => {
    render(<SampleComponent />)
    await screen.findAllByRole('item')
    expect(screen.getAllByRole('item')).toHaveLength(4)
  })
})
```
