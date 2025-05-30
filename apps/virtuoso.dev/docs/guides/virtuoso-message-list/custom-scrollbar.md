---
id: virtuoso-message-list-custom-scrollbar
title: Custom Scrollbar
sidebar_label: Custom Scrollbar
sidebar_position: 30
slug: /virtuoso-message-list/custom-scrollbar
---

```tsx live
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'

export default function App() {
  return (
    <SimpleBar style={{ maxHeight: 300 }}>
      <div style={{ height: 600 }}>Hello world</div>
    </SimpleBar>
  )
}
```
