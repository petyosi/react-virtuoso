---
id: scroll-handling
title: Scroll Handling
sidebar_label: Scroll Handling
slug: /scroll-handling/
---

Loading and rendering complext content while scrolling affects the scrolling performance.

To address that, the Virtuoso component exposes a `scrollingStateChange` event property which gets called when the user starts / stops scrolling.
The callback receives true when the user starts scrolling and false shortly after the last scroll event.

Handling this event can be used to optimize performance by hiding/replacing certain elements in the items.

```jsx live
() => {
  const [isScrolling, setIsScrolling] = useState(false);
  const items = useMemo(() => generateRandomItems(100), [])
  return (
    <Virtuoso
      data={items}
      isScrolling={setIsScrolling}
      itemContent={(index, item) => {
        return (
          <div
            style={{
              borderBottom: "1px solid #ccc",
              padding: '1em 0'
            }}
          >
            
            <div style={{ float: 'left', margin: '1rem' }}>
              {isScrolling ? avatarPlaceholder() : avatar() }
            </div>

            {item.longText}
          </div>
        )
      }}
    />
  )
}
```
