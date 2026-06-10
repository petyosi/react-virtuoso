---
name: message-list
description: >-
  Build chat, messaging, and AI conversation UIs with @virtuoso.dev/message-list. Use this skill when (1) building a chat or
  messaging interface, (2) streaming AI assistant responses into a conversation, (3) loading older messages when scrolling up,
  (4) adding scroll-to-bottom buttons or unseen-message indicators, (5) switching between channels/conversations, or (6) any task
  involving VirtuosoMessageList, VirtuosoMessageListLicense, useVirtuosoMethods, useVirtuosoLocation, scrollModifier, or
  data.append/prepend/map. The package is commercial and requires a license key.
---

# @virtuoso.dev/message-list

`VirtuosoMessageList` is a virtualized list purpose-built for human and AI chat: stick-to-bottom behavior, streaming responses that grow without scroll jumps, history prepending that preserves the visual position, and scroll position tracking. Use it instead of plain `Virtuoso` when building conversation UIs — these behaviors are built in rather than hand-assembled.

## Licensing

The package is commercial (annual, per-developer). Every instance must be wrapped in `VirtuosoMessageListLicense`:

```tsx
<VirtuosoMessageListLicense licenseKey={licenseKey}>
  <VirtuosoMessageList ... />
</VirtuosoMessageListLicense>
```

An empty `licenseKey=""` works as a 30-day non-production trial. Validation is local — no network requests. Surface this to the user when introducing the package into a project; keys come from <https://virtuoso.dev/pricing/>.

## Core mental model: data updates carry scroll instructions

Instead of separate imperative scroll calls, each data update includes a `scrollModifier` describing how the viewport should react:

```tsx
const [data, setData] = useState<VirtuosoMessageListProps<Message, null>['data']>(() => ({
  data: initialMessages,
  scrollModifier: { type: 'item-location', location: { index: 'LAST', align: 'end' } },
}))

<VirtuosoMessageList<Message, null> style={{ height: '100%' }} data={data} computeItemKey={({ data }) => data.key} ItemContent={ItemContent} />
```

`ItemContent` is a component receiving `{ data, index, context }` props (not positional arguments like react-virtuoso).

### Scroll modifier reference

| Modifier                                               | When to use                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ------ | -------------------------- |
| `{ type: 'item-location', location, purgeItemSizes? }` | Initial load or channel switch; `purgeItemSizes: true` clears cached sizes when the items are different |
| `{ type: 'auto-scroll-to-bottom', autoScroll }`        | New messages arrive; callback receives `{ atBottom, scrollInProgress, ... }` and returns `'smooth'      | 'auto' | false` or an item location |
| `'prepend'`                                            | Older messages added to the top; keeps the current messages visually in place                           |
| `{ type: 'items-change', behavior }`                   | Existing items changed size (streaming text, reactions); stays at bottom if already there               |
| `'remove-from-start'` / `'remove-from-end'`            | Trimming data while preserving the visual position                                                      |
| `null` / `undefined`                                   | Leave the scroll position alone                                                                         |

## Common patterns

### Receiving messages (auto-scroll when at bottom)

```tsx
setData((current) => ({
  data: [...current.data, incoming],
  scrollModifier: {
    type: 'auto-scroll-to-bottom',
    autoScroll: ({ atBottom, scrollInProgress }) => ({
      index: 'LAST',
      align: 'end',
      behavior: atBottom || scrollInProgress ? 'smooth' : 'auto',
    }),
  },
}))
```

Returning `false` from `autoScroll` when not at bottom is how you keep the viewport still and instead increment an unseen-messages counter.

### Streaming an AI response

Append an empty assistant message, then grow it as tokens arrive:

```tsx
setData((current) => ({
  data: current.data.map((msg) => (msg.key === botKey ? { ...msg, text: msg.text + chunk } : msg)),
  scrollModifier: { type: 'items-change', behavior: 'smooth' },
}))
```

`items-change` keeps the view pinned to the bottom while the message grows, without jumping if the user scrolled up. See [ai-chatbot](references/3.examples/02.ai-chatbot.md) and [gemini](references/3.examples/03.gemini.md) (question pinned to top, answer streams below).

### Loading older messages on scroll-up

```tsx
<VirtuosoMessageList
  onScroll={(location) => {
    if (location.listOffset > -100 && !loading) {
      loadOlder().then((older) => setData((current) => ({ data: [...older, ...current.data], scrollModifier: 'prepend' })))
    }
  }}
/>
```

No `firstItemIndex` bookkeeping is needed (unlike plain Virtuoso) — `'prepend'` preserves the position automatically.

### Scroll-to-bottom button

`StickyFooter` renders fixed at the bottom of the viewport; combine with the location hook:

```tsx
const StickyFooter = () => {
  const location = useVirtuosoLocation()
  const methods = useVirtuosoMethods()
  if (location.bottomOffset <= 200) return null
  return <button onClick={() => methods.scrollToItem({ index: 'LAST', align: 'end', behavior: 'auto' })}>▼</button>
}
```

### Switching channels

Keep one data object per channel and swap with `replace`/`item-location` + `purgeItemSizes: true`, so size caches from the previous channel don't distort the new one. See [multiple-channels](references/2.tutorial/07.multiple-channels.md).

## Imperative API

Via `ref={useRef<VirtuosoMessageListMethods<Message>>(null)}` from outside, or `useVirtuosoMethods()` from components rendered inside the list:

- `data.append(items, scrollToBottom?)`, `data.prepend(items)`
- `data.map(fn, autoscrollBehavior?)` — update items (reactions, edits, streaming)
- `data.findAndDelete(predicate)`, `data.deleteRange(start, length)`, `data.replace(data, options?)`
- `data.find(predicate)`, `data.findIndex(predicate)`, `data.get()`, `data.getCurrentlyRendered()`
- `scrollToItem({ index: number | 'LAST', align, behavior })`

The declarative `data` prop and the imperative `data.*` methods are alternative ways to drive the same list — pick one as the primary mechanism per component to avoid fighting updates.

## Key props and hooks

- `ItemContent: ({ data, index, context }) => JSX` — message renderer
- `context` — shared state (current user, loading flags) available to `ItemContent` and all custom slots; avoids prop drilling
- `computeItemKey({ data })` — stable message key; required for prepending/streaming to work without remounts
- Slots: `Header`, `Footer` (scroll with content), `StickyHeader`, `StickyFooter` (fixed, measured to avoid overlap), `EmptyPlaceholder`
- `initialLocation: { index: 'LAST', align: 'end' }` — start at the bottom
- Hooks (inside the list): `useVirtuosoMethods()`, `useVirtuosoLocation()` (`atBottom`, `bottomOffset`, `listOffset`, `scrollInProgress`), `useCurrentlyRenderedData()`

## Pitfalls

- **No height → nothing renders.** The component needs a real height (`style={{ height: '100%' }}` with a sized parent).
- **Missing `computeItemKey`** causes remounts and scroll jumps on prepend and streaming updates.
- **Margins on message items** break height measurement (ResizeObserver excludes margins) — use padding.
- **"ResizeObserver loop" errors are benign** — filter them in dev overlays and error tracking; see [resize-observer-errors](references/19.resize-observer-errors.md).
- **JSDOM tests need mocked measurements** via `VirtuosoMessageListTestingContext.Provider value={{ itemHeight, viewportHeight }}` plus a ResizeObserver polyfill; prefer Playwright for scroll behavior. See [testing](references/11.testing.md).

## References

- [references/README.md](references/README.md) — overview and live example
- `references/2.tutorial/` — step-by-step chat build: [intro](references/2.tutorial/01.intro.md), [message-list](references/2.tutorial/02.message-list.md), [loading-older-messages](references/2.tutorial/03.loading-older-messages.md), [scroll-to-bottom-button](references/2.tutorial/04.scroll-to-bottom-button.md), [receive-messages](references/2.tutorial/05.receive-messages.md), [send-messages](references/2.tutorial/06.send-messages.md), [multiple-channels](references/2.tutorial/07.multiple-channels.md)
- `references/3.examples/` — [messaging](references/3.examples/01.messaging.md), [ai-chatbot](references/3.examples/02.ai-chatbot.md), [gemini](references/3.examples/03.gemini.md), [reactions](references/3.examples/04.reactions.md), [date-separators](references/3.examples/05.date-separators.md), [scroll-to-reply](references/3.examples/06.scroll-to-reply.md), [grouped-messages](references/3.examples/07.grouped-messages.md)
- Feature guides: [headers-footers](references/4.headers-footers.md), [context](references/5.context.md), [item-keys](references/6.item-keys.md), [hooks](references/7.hooks.md), [custom-scrollbar](references/8.custom-scrollbar.md), [scrolling-to-item](references/9.scrolling-to-item.md), [smooth-scrolling](references/10.smooth-scrolling.md), [imperative-data-api](references/15.imperative-data-api.md), [scroll-modifier](references/20.scroll-modifier.md), [testing](references/11.testing.md), [licensing](references/80.licensing.md)

Full API reference: <https://virtuoso.dev/message-list/>
