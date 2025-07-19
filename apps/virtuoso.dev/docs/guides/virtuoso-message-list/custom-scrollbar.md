---
id: virtuoso-message-list-custom-scrollbar
title: Custom Scrollbar Component
sidebar_label: Custom Scrollbar Component
sidebar_position: 30
slug: /virtuoso-message-list/custom-scrollbar
---

# Custom Scrollbar Component

Similar to the standard Virtuoso component, `VirtuosoMessageList` supports integration with custom scrollbar components. The custom scrollbar must expose a `ref` to its scrollable element, which is passed through the `customScrollParent` prop. The example above demonstrates how to integrate [SimpleBar](https://github.com/Grsmto/simplebar), a popular custom scrollbar library, with `VirtuosoMessageList`.

```tsx live
import { VirtuosoMessageListLicense, VirtuosoMessageList } from '@virtuoso.dev/message-list'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import { useState } from 'react'

export default function App() {
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null)
  return (
    <VirtuosoMessageListLicense licenseKey="">
      <SimpleBar style={{ height: 300 }} scrollableNodeProps={{ ref: setScrollParent }}>
        {scrollParent && (
          <VirtuosoMessageList customScrollParent={scrollParent} data={{ data: Array.from({ length: 100 }, (_, index) => index) }} />
        )}
      </SimpleBar>
    </VirtuosoMessageListLicense>
  )
}
```
