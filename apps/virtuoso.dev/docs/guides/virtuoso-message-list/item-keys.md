---
id: virtuoso-message-list-item-keys
title: Virtuoso Message List Item Keys
sidebar_label: Item Keys
sidebar_position: 6
slug: /virtuoso-message-list/item-keys
---

# Item Keys

React uses a unique key to identify each item in a list. By default, the Message List component uses the items numeric index for that, but this index might change as we load new messages or delete some. To address that, the message list exposes a `computeItemKey` prop. This prop should return a unique key for each item based on the item data.

```tsx live
import { VirtuosoMessageList, VirtuosoMessageListLicense } from '@virtuoso.dev/message-list'

export default function App() {
  return (
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList
        computeItemKey={({ data }) => {
          return `item-${data}`
        }}
        style={{ height: '100%' }}
        data={{ data: Array.from({ length: 100 }, (_, index) => index) }}
      />
    </VirtuosoMessageListLicense>
  )
}
```
