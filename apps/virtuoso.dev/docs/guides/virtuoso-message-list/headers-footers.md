---
id: virtuoso-message-list-headers-footers
title: Virtuoso Message List Headers and Footers
sidebar_label: Headers and Footers
sidebar_position: 5
slug: /virtuoso-message-list/headers-footers
---

# Headers and Footers

The message list component accepts `Header` and `Footer` components that can be used to display additional content at the top and bottom of the list. Additionally, `StickyHeader` and `StickyFooter` components can be used to create sticky headers and footers.

:::caution
The custom components should not be defined as inline prop values. Doing so will re-declare the component on every render, causing unnecessary re-renders.
If you need to access certain changing values inside the custom components, use the [`context`](/virtuoso-message-list/context) prop.
:::

## Header and Footer

The example below features a basic list with Header and Footer specified.

```tsx live
import {
  VirtuosoMessageListProps,
  VirtuosoMessageList,
  useVirtuosoMethods,
  VirtuosoMessageListLicense,
  VirtuosoMessageListMethods,
} from '@virtuoso.dev/message-list'

const Header: VirtuosoMessageListProps<number, null>['Header'] = () => <div style={{ height: 30, background: 'lightblue' }}>Header</div>
const Footer: VirtuosoMessageListProps<number, null>['Footer'] = () => <div style={{ height: 30, background: 'lightblue' }}>Footer</div>

export default function App() {
  return (
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList
        Header={Header}
        Footer={Footer}
        style={{ height: '100%' }}
        data={{ data: Array.from({ length: 100 }, (_, index) => index) }}
      />
    </VirtuosoMessageListLicense>
  )
}
```

## Sticky Header and Footer

Unlike the regular ones, the sticky custom components are persistently visible in the viewport, making them suitable for displaying custom UI (like pinned messages, for example). Their size is getting measured, so that the first/last messages are not obscured by them.

```tsx live
import {
  VirtuosoMessageListProps,
  VirtuosoMessageList,
  useVirtuosoMethods,
  VirtuosoMessageListLicense,
  VirtuosoMessageListMethods,
} from '@virtuoso.dev/message-list'

const StickyHeader: VirtuosoMessageListProps<number, null>['StickyHeader'] = () => (
  <div style={{ height: 30, background: 'lightblue' }}>Header</div>
)
const StickyFooter: VirtuosoMessageListProps<number, null>['StickyFooter'] = () => (
  <div style={{ height: 30, background: 'lightblue' }}>Footer</div>
)

export default function App() {
  return (
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList
        StickyHeader={StickyHeader}
        StickyFooter={StickyFooter}
        style={{ height: '100%' }}
        data={{ data: Array.from({ length: 100 }, (_, index) => index) }}
      />
    </VirtuosoMessageListLicense>
  )
}
```

## Overlaying Sticky Header and Footer

By default, the sticky header and footer will offset the list content. In some cases, we would like to avoid that - for example, the scroll to bottom button should not leave space below the messages. To achieve that, we can wrap the content with a `position: absolute` container.

```tsx live
import {
  VirtuosoMessageListProps,
  VirtuosoMessageList,
  useVirtuosoMethods,
  VirtuosoMessageListLicense,
  VirtuosoMessageListMethods,
} from '@virtuoso.dev/message-list'

const StickyHeader: VirtuosoMessageListProps<number, null>['StickyHeader'] = () => {
  return <div style={{ position: 'absolute', right: 0, top: 0, background: 'lightblue' }}>Header</div>
}

const StickyFooter: VirtuosoMessageListProps<number, null>['StickyFooter'] = () => {
  return <div style={{ position: 'absolute', right: 0, bottom: 0, background: 'lightblue' }}>Footer</div>
}

export default function App() {
  return (
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList
        StickyHeader={StickyHeader}
        StickyFooter={StickyFooter}
        style={{ height: '100%' }}
        data={{ data: Array.from({ length: 100 }, (_, index) => index) }}
      />
    </VirtuosoMessageListLicense>
  )
}
```

## Combining Sticky and Regular Components

If needed, you can combine sticky and regular components. The sticky ones will be always visible, while the regular ones will scroll with the content.

```tsx live
import {
  VirtuosoMessageListProps,
  VirtuosoMessageList,
  useVirtuosoMethods,
  VirtuosoMessageListLicense,
  VirtuosoMessageListMethods,
} from '@virtuoso.dev/message-list'

const StickyHeader: VirtuosoMessageListProps<number, null>['StickyHeader'] = () => (
  <div style={{ height: 30, background: 'lightblue' }}>Sticky Header</div>
)
const StickyFooter: VirtuosoMessageListProps<number, null>['StickyFooter'] = () => (
  <div style={{ height: 30, background: 'lightblue' }}>Sticky Footer</div>
)
const Header: VirtuosoMessageListProps<number, null>['Header'] = () => <div style={{ height: 30, background: 'lightgreen' }}>Header</div>
const Footer: VirtuosoMessageListProps<number, null>['Footer'] = () => <div style={{ height: 30, background: 'lightgreen' }}>Footer</div>

export default function App() {
  return (
    <VirtuosoMessageListLicense licenseKey="">
      <VirtuosoMessageList
        StickyHeader={StickyHeader}
        StickyFooter={StickyFooter}
        Header={Header}
        Footer={Footer}
        style={{ height: '100%' }}
        data={{ data: Array.from({ length: 100 }, (_, index) => index) }}
      />
    </VirtuosoMessageListLicense>
  )
}
```
