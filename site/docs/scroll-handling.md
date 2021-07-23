---
id: scroll-handling
title: Scroll Handling
sidebar_label: Scroll Handling
slug: /scroll-handling/
---

Loading and rendering complex content while scrolling affects the scrolling performance.

To address that, the Virtuoso component exposes a `scrollingStateChange` event property which gets called when the user starts / stops scrolling.
The callback receives true when the user starts scrolling and false shortly after the last scroll event.

Handling this event can be used to optimize performance by hiding/replacing certain elements in the items.

```jsx live
() => {
  const [isScrolling, setIsScrolling] = useState(false);
  const users = useMemo(() => generateUsers(100), [])
  return (
    <Virtuoso
      data={users}
      isScrolling={setIsScrolling}
      itemContent={(index, user) => {
        return (
          <div
            style={{
              backgroundColor: user.bgColor,
              padding: '1rem 0'
            }}
          >
            
            <div style={{ float: 'left', margin: '1rem' }}>
              {isScrolling ? avatarPlaceholder() : avatar() }
            </div>

            <h4>{user.name}</h4>
            <div style={{ marginTop: '1rem' }}>
            {user.longText}
            </div>
          </div>
        )
      }}
    />
  )
}
```
