---
id: range-change-callback
title: Range Change Callback
sidebar_label: Range Change Callback
slug: /range-change-callback/
---

The `rangeChanged` callback property gets called with the start / end indexes of the visible range.

Note: the `rangeChanged` reports the rendered items, which are affected by the `overscan` property - not the ones visible in the viewport. 
If you must track only the visible items, you can try the workaround from [this Github issue](https://github.com/petyosi/react-virtuoso/issues/118#issuecomment-642156138).

```jsx live
() => {
  const [visibleRange, setVisibleRange] = useState({
    startIndex: 0,
    endIndex: 0,
  });
  const items = useMemo(() => generateRandomItems(100), []);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <p>
        current visible range: {visibleRange.startIndex} -{" "}
        {visibleRange.endIndex}{" "}
      </p>
      <Virtuoso
        data={items}
        rangeChanged={setVisibleRange}
        style={{ flex: 1 }}
        itemContent={(index, item) => (
          <div
            style={{
              height: item.height,
              borderBottom: "1px solid #ccc",
            }}
          >
            {item.text}
          </div>
        )}
      />
    </div>
  )
}
```
