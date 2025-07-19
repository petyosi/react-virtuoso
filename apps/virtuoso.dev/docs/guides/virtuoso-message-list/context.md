---
id: virtuoso-message-list-context
title: Context
sidebar_label: Context
sidebar_position: 6
slug: /virtuoso-message-list/context
---

# Context

In addition to the `data` prop, the message list component accepts a `context` prop, which can be used to pass additional data updates to the `ItemContent` and the custom headers and footers, if present. The `context` prop can be anything, but usually it's a key/value object. For example, the message list tutorial uses the context to work with the loading flags and the channel class instance.

:::note
The `VirtuosoMessageList` second type parameter is the type of the `context` prop.
:::

The example below has a header component that accesses the `loading` flag from the context. The same approach works for all custom components.

```tsx live
import { VirtuosoMessageList, VirtuosoMessageListProps, VirtuosoMessageListLicense } from '@virtuoso.dev/message-list'
import { useState } from 'react'

interface MessageListContext {
  loading: boolean
}

const Header: VirtuosoMessageListProps<number, MessageListContext>['Header'] = ({ context }) => (
  <div style={{ height: 30, background: 'lightblue' }}>Header - {context.loading ? 'loading' : 'loaded'}</div>
)

export default function App() {
  const [loading, setLoading] = useState(false)
  const [data] = useState(() => {
    return {
      data: Array.from({ length: 100 }, (_, index) => index),
    }
  })

  return (
    <>
      <button onClick={() => setLoading(!loading)}>Toggle Loading</button>
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<number, MessageListContext> context={{ loading }} Header={Header} style={{ height: 500 }} data={data} />
      </VirtuosoMessageListLicense>
    </>
  )
}
```
