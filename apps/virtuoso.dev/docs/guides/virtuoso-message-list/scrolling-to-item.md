---
id: virtuoso-message-list-scroll-to-item
title: Virtuoso Message List Scroll to Item
sidebar_label: Scroll to Item
sidebar_position: 7
slug: /virtuoso-message-list/scroll-to-item
---

# Scroll to Item

The message list exposes an imperative API to scroll to a specific item. This is useful when you want to scroll to a specific message or a specific index in the list.

:::caution
If you want to change the scroll location when updating the data of the list, make sure to use the respective [scroll modifier](/virtuoso-message-list/scroll-modifier) field. The value is used with the right timing and will not cause unnecessary re-renders and incorrect scroll position due to changed item sizes.
:::

```tsx live
import { VirtuosoMessageList, VirtuosoMessageListMethods, VirtuosoMessageListLicense } from '@virtuoso.dev/message-list'
import React from 'react'

export default function App() {
  const ref = React.useRef<VirtuosoMessageListMethods>(null)
  const offset = React.useRef(100)

  return (
    <>
      <button
        onClick={() => {
          ref.current.scrollToItem({ index: 50, align: 'center' })
        }}
      >
        Scroll to Item 50 in the center
      </button>{' '}
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList ref={ref} style={{ height: 500 }} data={{ data: Array.from({ length: 100 }, (_, index) => index) }} />
      </VirtuosoMessageListLicense>
    </>
  )
}
```
