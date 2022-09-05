---
id: mocking-in-tests
title: Mocking in tests
sidebar_label: Mocking in tests
slug: /mocking-in-tests/
---

Virtuoso exposes a `VirtuosoMockContext` context API, which can be used to mock DOM measurements in tests, so list items or table rows would be rendered and could be tested with snapshots or other assertions.

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
