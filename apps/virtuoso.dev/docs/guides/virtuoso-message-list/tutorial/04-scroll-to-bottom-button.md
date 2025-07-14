---
id: virtuoso-message-list-tutorial-scroll-to-bottom-button
title: Virtuoso Message List Tutorial - Scroll to Bottom Button
sidebar_label: Scroll to Bottom Button
sidebar_position: 4
slug: /virtuoso-message-list/tutorial/scroll-to-bottom-button
---

# Part 4 - Scroll to Bottom Button

Now that we can browse the channel history, let's add the convenience of a "scroll to bottom" button. This button will automatically scroll to the latest messages when clicked. We want to display the button only when the user is has scrolled up.

## Sticky Footer Explained

The Message List component accepts a `StickyFooter` custom component prop that allows you to render a footer at the bottom of the list. By default, the sticky footer (just like elements with `sticky` positioning) leaves additional space at the bottom of the scroller. In our case however, we want to have a button that overlays the list without taking up additional space. To achieve this, we're going to wrap the button in a `div` with `position: absolute` and `bottom: 0` CSS properties. Let's declare the `StickyFooter` component outside of the default page export (next to the other custom components):

```tsx
const StickyFooter: MessageListProps['StickyFooter'] = () => {
  const location = useVirtuosoLocation()
  const virtuosoMethods = useVirtuosoMethods()
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 10,
        right: 50,
      }}
    >
      {location.bottomOffset > 200 && (
        <>
          <button
            style={{
              backgroundColor: 'white',
              border: '2px solid black',
              borderRadius: '100%',
              width: 30,
              height: 30,
              color: 'black',
            }}
            onClick={() => {
              virtuosoMethods.scrollToItem({ index: 'LAST', align: 'end', behavior: 'auto' })
            }}
          >
            {/* down arrow */}
            &#9660;
          </button>
        </>
      )}
    </div>
  )
}
```

Notice the two hooks: `useVirtuosoLocation` and `useVirtuosoMethods`. The `useVirtuosoLocation` hook returns the current scroll location of the list - the same `ListScrollLocation` shape we used in the previous part. The `useVirtuosoMethods` hook returns the imperative methods of the `VirtuosoMessageList` component. We use the `scrollToItem` method to scroll to the last item in the list when the button is clicked. Those hooks are accessible from any custom component rendered inside the `VirtuosoMessageList` component, including `ItemContent`.

Add the `StickyFooter` component to the `VirtuosoMessageList` props:

```tsx
  <VirtuosoMessageList<ChatMessage, MessageListContext>
    // highlight-start
    StickyFooter={StickyFooter}
```

If everything is setup correctly, you should see a button at the bottom right corner of the list when you scroll up. Clicking it should scroll the list to the bottom.
