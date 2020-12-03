---
id: virtuoso-api-reference
title: Virtuoso API Reference
sidebar_label: Virtuoso 
slug: /virtuoso-api-reference/
---

import Props from './api/interfaces/_components_.virtuosoprops.md'
import GroupProps from './api/interfaces/_components_.groupedvirtuosoprops.md'
import Methods from './api/interfaces/_components_.virtuosohandle.md'

All properties are optional - by default, the component will render empty. Under the hood, both `Virtuoso` and `GroupedVirtuoso` are the same component - the only difference is that they have different TypeScript interfaces applied. 
All `Virtuoso` props work for `GroupedVirtuoso`, but the properties in the `GroupedVirtuoso` section work only in grouped mode.

If you are using TypeScript and want to use correctly typed component `ref`, you can use the `VirtuosoHandle` and the `GroupedVirtuosoHandle` types.

```tsx
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
//...
const ref = useRef<VirtuosoHandle>(null)
//...
<Virtuoso ref={ref} /*...*/ />
```

## Virtuoso Properties

<div className="generated-api">
<Props />
</div>

## GroupedVirtuoso Properties

<div className="generated-api">
<GroupProps />
</div>

## Methods

<div className="generated-api">
<Methods />
</div>
