---
id: scroll-to-index
title: Scroll to Index
sidebar_label: Scroll to Index
slug: /scroll-to-index/
---

The Virtuoso component exposes an imperative `scrollToIndex` method, which scrolls the item at the specified index into view.
As an optional configuration, the method accepts `align: 'start' | 'center' | 'end'` and `behavior: 'smooth'`.

Warning: Using smooth scrolling over large amount of items can kill performance and potentially clash with loading strategies.

```jsx live
() => {
  const [align, setAlign] = useState("start");
  const [behavior, setBehavior] = useState("auto");
  const virtuoso = useRef(null);
  const items = useMemo(() => generateRandomItems(1000), []);
  return (
    <div>
      <ul className="knobs">
        <li>
          <button
            onClick={() => {
              virtuoso.current.scrollToIndex({
                index: 0,
                align,
                behavior
              });
              return false;
            }}
          >
            Scroll To 1
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              virtuoso.current.scrollToIndex({
                index: 499,
                align,
                behavior
              });
              return false;
            }}
          >
            Scroll To 500
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              virtuoso.current.scrollToIndex({
                index: 999,
                align,
                behavior
              });
              return false;
            }}
          >
            Scroll To 1000
          </button>
        </li>
        <li>
          <label>
            Align:
            <select value={align} onChange={(e) => setAlign(e.target.value)}>
              <option value="start">Start</option>
              <option value="center">Center</option>
              <option value="end">End</option>
            </select>
          </label>
        </li>
        <li>
          <label>
            Behavior:
            <select value={behavior} onChange={(e) => setBehavior(e.target.value)}>
              <option value="auto">Instant (auto)</option>
              <option value="smooth">Smooth</option>
            </select>
          </label>
        </li>
      </ul>
      <div style={{height: 600}}>
        <Virtuoso
          data={items}
          ref={virtuoso}
          itemContent={(index, item) => {
            return (
              <div
                style={{
                  borderBottom: "1px solid #ccc",
                  padding: "1em 0",
                }}
              >
                <div style={{ float: "left", margin: "1rem" }}>{avatar()}</div>

                <h4>{item.text}</h4>

                {item.longText}
              </div>
            );
          }}
        />
      </div>
    </div>
  )
}
```
