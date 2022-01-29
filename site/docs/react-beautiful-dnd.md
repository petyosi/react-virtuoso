---
id: react-beautiful-dnd
title: React Beautiful DND
sidebar_label: React Beautiful DND
slug: /react-beautiful-dnd/
---

The example below integrates React Virtuoso with [React Beautiful DND](https://github.com/atlassian/react-beautiful-dnd). 

```jsx live import=react-beautiful-dnd
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Virtuoso } from "react-virtuoso";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Virtuoso's resize observer can this error,
// which is caught by DnD and aborts dragging.
window.addEventListener("error", (e) => {
  if (
    e.message ===
      "ResizeObserver loop completed with undelivered notifications." ||
    e.message === "ResizeObserver loop limit exceeded"
  ) {
    e.stopImmediatePropagation();
  }
});

// Generate our initial big data set
// Go on, make it 10,000 ??
const initial = Array.from({ length: 1000 }, (_, k) => ({
  id: `id:${k}`,
  text: `item ${k}`
}));

function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}

function Item({ provided, item, isDragging }) {
  return (
    <div style={{ paddingBottom: "8px" }}>
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
        style={provided.draggableProps.style}
        className={`item ${isDragging ? "is-dragging" : ""}`}
      >
        {item.text}
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState(initial);

  const onDragEnd = React.useCallback(
    (result) => {
      if (!result.destination) {
        return;
      }
      if (result.source.index === result.destination.index) {
        return;
      }

      // void setItems
      setItems((items) =>
        reorder(items, result.source.index, result.destination.index)
      );
    },
    [setItems]
  );

  const HeightPreservingItem = React.useCallback(({ children, ...props }) => {
    const [size, setSize] = useState(0);
    const knownSize = props["data-known-size"];
    useEffect(() => {
      setSize((prevSize) => {
        return knownSize == 0 ? prevSize : knownSize;
      });
    }, [knownSize]);
    // check style.css for the height-preserving-container rule
    return (
      <div
        {...props}
        className="height-preserving-container"
        style={{
          "--child-height": `${size}px`
        }}
      >
        {children}
      </div>
    );
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="droppable"
          mode="virtual"
          renderClone={(provided, snapshot, rubric) => (
            <Item
              provided={provided}
              isDragging={snapshot.isDragging}
              item={items[rubric.source.index]}
            />
          )}
        >
          {(provided) => {
            return (
              <Virtuoso
                components={{
                  Item: HeightPreservingItem
                }}
                scrollerRef={provided.innerRef}
                data={items}
                style={{ width: 300, height: 500 }}
                itemContent={(index, item) => {
                  return (
                    <Draggable
                      draggableId={item.id}
                      index={index}
                      key={item.id}
                    >
                      {(provided) => (
                        <Item
                          provided={provided}
                          item={item}
                          isDragging={false}
                        />
                      )}
                    </Draggable>
                  );
                }}
              />
            );
          }}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
```
