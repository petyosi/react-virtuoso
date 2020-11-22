---
id: scroll-seek-placeholders
title: Scroll Seek Placeholders
sidebar_label: Scroll Seek Placeholders
slug: /scroll-seek-placeholders/
---

The `scrollSeekConfiguration` property allows you to render a placeholder element instead of the actual item if the user scrolls too fast. 

This can improve scrolling performance and delay the actual load of data from the server.

```jsx live
() => {
  const randomHeights = useMemo(
    () =>
      Array(10)
        .fill(true)
        .map(() => Math.round(Math.random() * 14) + 1),
    []
  );

  const users = useMemo(() => Array(1000).fill(true).map((_, i) => getUser(i)), [])

  // use the visible range to provide information
  // about the list current position.
  const [visibleRange, setVisibleRange] = useState(["-", "-"]);

  return (
    <div style={{ display: "flex", flexDirection: 'column', height: '100%' }}>
      <div>
        Current visible range:{" "}
        <div>
          <strong>
            {visibleRange[0]} - {visibleRange[1]}
          </strong>
        </div>{" "}
      </div>

      <div style={{ flex: 1 }}>
        <Virtuoso
          data={users}
          itemContent={(index, user) => <div>{user.name}</div>}
          components={{
            // You can use index to randomize
            // and make the placeholder list more organic.
            // the height passed is the one measured for the real item. 
            // the placeholder should be the same size.
            ScrollSeekPlaceholder: ({ height, index }) => (
              <div
                style={{
                  height,
                  padding: "8px",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: "#e5e5e5",
                    height: randomHeights[index % 10],
                  }}
                ></div>
              </div>
            ),
          }}
          scrollSeekConfiguration={{
            enter: (velocity) => Math.abs(velocity) > 50,
            exit: (velocity) => {
              console.log(velocity)
              const shouldExit = Math.abs(velocity) < 10;
              if (shouldExit) {
                setVisibleRange(["-", "-"]);
              }
              return shouldExit;
            },
            change: (_velocity, { startIndex, endIndex }) => setVisibleRange([startIndex, endIndex])
          }}
        />
      </div>
    </div>
  )
}
```
