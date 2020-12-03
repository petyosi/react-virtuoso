---
id: virtuoso-grid-api-reference
title: Virtuoso Grid API Reference
sidebar_label: Virtuoso Grid
slug: /virtuoso-grid-api-reference/
---

import Props from './api/interfaces/_components_.virtuosogridprops.md'
import Methods from './api/interfaces/_components_.virtuosohandle.md'

All properties are optional - by default, the component will render empty. 

  If you are using TypeScript and want to use correctly typed component `ref`, you can use `VirtuosoGridHandle` types.

```tsx
import { VirtuosoGrid, VirtuosoGridHandle } from 'react-virtuoso'
//...
const ref = useRef<VirtuosoGridHandle>(null)
//...
<VirtuosoGrid ref={ref} /*...*/ />
```

## Properties

<div className="generated-api">
<Props />
</div>

## Methods

<div className="generated-api">
<Methods />
</div>
