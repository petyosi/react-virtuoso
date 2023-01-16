---
id: table-virtuoso-api-reference
title: Table Virtuoso API Reference
sidebar_label: Table Virtuoso
slug: /table-virtuoso-api-reference/
---

import Props from './api/interfaces/_component_interfaces_tablevirtuoso_.tablevirtuosoprops.md'
import GroupProps from './api/interfaces/_component_interfaces_tablevirtuoso_.groupedtablevirtuosoprops.md'
import VirtuosoProps from './api/interfaces/_component_interfaces_virtuoso_.virtuosoprops.md'
import Methods from './api/interfaces/_component_interfaces_virtuoso_.virtuosohandle.md'

All properties are optional - by default, the component will render empty.

If you are using TypeScript and want to use correctly typed component `ref`, you can use the `VirtuosoHandle`.

```tsx
import { TableVirtuoso, VirtuosoHandle } from 'react-virtuoso'
//...
const ref = useRef<VirtuosoHandle>(null)
//...
<TableVirtuoso ref={ref} /*...*/ />
```

## TableVirtuoso Properties

<div className="generated-api">
<Props />
</div>

## GroupedTableVirtuoso Properties

<div className="generated-api">
<GroupProps />
</div>

## Methods

<div className="generated-api">
<Methods />
</div>
