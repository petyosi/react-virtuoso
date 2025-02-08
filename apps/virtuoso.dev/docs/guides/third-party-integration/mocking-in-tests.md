---
id: mocking-in-tests
title: Mocking in tests
sidebar_label: Mocking in tests
slug: /mocking-in-tests/
---

If you try to use Virtuoso in a testing environment, you're likely going to discover that it does not render any items. This is due to rendering being controlled by measuring the height of its DOM elements (the list container and the items themselves).
This information is not available in the simulated JSDOM environment.
To work around this, Virtuoso exposes a `VirtuosoMockContext` context API, which can be used to mock DOM measurements in tests, so list items or table rows would be rendered and could be tested with snapshots or other assertions.

It allows specifying `viewportHeight` and `itemHeight`.

```jsx
import { render } from '@testing-library/react'
import * as React from 'react'
import { Virtuoso, VirtuosoMockContext } from 'react-virtuoso'

describe('Virtuoso', () => {
  type Item = { id: string, value: string }
  const data: Item[] = [
    { id: '1', value: 'foo' },
    { id: '2', value: 'bar' },
    { id: '3', value: 'baz' },
  ]

  it('correctly renders items', () => {
    const { container } = render(<Virtuoso data={data} />, {
      wrapper: ({ children }) => (
        <VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
      ),
    })

    expect(container).toMatchSnapshot()
  })
})
```

To mock VirtuosoGrid rendering, use `VirtuosoGridMockContext` instead, which accepts additional `viewportWidth` and `itemWidth` props.

```jsx
import { render } from '@testing-library/react'
import * as React from 'react'
import { VirtuosoGrid, VirtuosoGridMockContext } from 'react-virtuoso'

describe('Virtuoso', () => {
  type Item = { id: string, value: string }
  const data: Item[] = [
    { id: '1', value: 'foo' },
    { id: '2', value: 'bar' },
    { id: '3', value: 'baz' },
  ]

  it('correctly renders items', () => {
    const { container } = render(<VirtuosoGrid data={data} />, {
      wrapper: ({ children }) => (
        <VirtuosoGridMockContext.Provider value={{ viewportHeight: 300, viewportWidth: 300, itemHeight: 100, itemWidth: 100 }}>
          {children}
        </VirtuosoGridMockContext.Provider>
      ),
    })

    expect(container).toMatchSnapshot()
  })
})
```
