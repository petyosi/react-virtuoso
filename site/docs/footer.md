---
id: footer
title: List with Footer Example
sidebar_label: Footer
slug: /footer/
---

The Virtuoso component rendering can be customized by passing components through the `components` property.

Passing a `Footer` component results in rendering the component at the bottom of the list.
The footer can be used for loading indicators or load more buttons.

Scroll to the bottom of the list to see `end reached`.

```jsx live
<Virtuoso
  data={generateUsers(100)}
  components={{
    Footer: () => {
      return (
        <div
          style={{
            padding: "1rem",
            textAlign: "center",
          }}
        >
          end reached
        </div>
      );
    },
  }}
  itemContent={(index, user) => (
    <div
      style={{
        backgroundColor: user.bgColor,
        padding: '1rem 0.5rem',
      }}
    >
      <h4>{user.name}</h4>
    </div>
  )}
/>
```
