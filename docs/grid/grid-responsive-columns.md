---
id: grid-responsive-columns
title: Grid with Responsive Columns
sidebar_label: Responsive Columns
slug: /grid-responsive-columns/
---

The `VirtuosoGrid` component displays **equally-sized items**, while supporting multiple items per row.

The component provides no styling out of the box. 
The styling and the layout of the items is be specified by passing two properties - `itemClassName` and `listClassName`.

Alternatively, you can use styled components and pass them as `components.Item` and `components.List`.

Either way, it is up to you to implement the layout with Flexbox or CSS grid. You can use plain old CSS or CSS in JS for the purpose.

### Responsive Layout

You can safely use media queries, `min-width`, percentages, etc. in the item layout definitions.
The grid observes the container/item dimensions and recalculates the scroll size accordingly. The example below uses inline styling, but you can easily put the styles in a stylesheet and change the item sizes with media queries.

```jsx live
import { forwardRef } from "react";
import { VirtuosoGrid } from "react-virtuoso";

// Ensure that this stays out of the component, 
// Otherwise the grid will remount with each render due to new component instances.
const gridComponents = {
  List: forwardRef(({ style, children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      style={{
        display: "flex",
        flexWrap: "wrap",
        ...style,
      }}
    >
      {children}
    </div>
  )),
  Item: ({ children, ...props }) => (
    <div
      {...props}
      style={{
        padding: "0.5rem",
        width: "33%",
        display: "flex",
        flex: "none",
        alignContent: "stretch",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  )
}

const ItemWrapper = ({ children, ...props }) => (
  <div
    {...props}
    style={{
      display: "flex",
      flex: 1,
      textAlign: "center",
      padding: "1rem 1rem",
      border: "1px solid gray",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

export default function App() {
  return (
    <>
      <VirtuosoGrid
        style={{ height: 500 }}
        totalCount={1000}
        components={gridComponents}
        itemContent={(index) => <ItemWrapper>Item {index}</ItemWrapper>}
      />
      <style>{`html, body, #root { margin: 0; padding: 0 }`}</style>
    </>
  );
}
```
