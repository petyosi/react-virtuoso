---
id: react-beautiful-dnd-window-scroller
title: RB DND + Window Scroller
sidebar_label: RB DND + Window Scroller
slug: /react-beautiful-dnd-window-scroller/
---

The example below integrates React Virtuoso with [React Beautiful DND](https://github.com/atlassian/react-beautiful-dnd) and the document scroller.

## List attached to RB DND + Window Scroller

```jsx live import=react-beautiful-dnd
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Virtuoso } from "react-virtuoso";
import * as ReactBeautifulDnd from "react-beautiful-dnd";

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

export default function App(){  
  const [items, setItems] = useState(() => {
    return Array.from({ length: 1000 }, (_, k) => ({
      id: `id:${k}`,
      text: `item ${k}`,
    }))
  })

  const reorder = React.useCallback((list, startIndex, endIndex) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
  }, [])

  const onDragEnd = React.useCallback(
    (result) => {
      if (!result.destination) {
        return
      }
      if (result.source.index === result.destination.index) {
        return
      }

      setItems((items) => reorder(items, result.source.index, result.destination.index))
    },
    [setItems, reorder]
  )

  const Item = React.useMemo(() => {
    return ({ provided, item, isDragging }) => {
      // For borders and visual space,
      // use container with padding rather than a margin
      // margins confuse virtuoso rendering
      return (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          style={{ ...provided.draggableProps.style, paddingBottom: '8px' }}
        >
          <div
            style={{
              border: `1px solid ${isDragging ? 'red' : 'black'}`,
            }}
          >
            {item.text}
          </div>
        </div>
      )
    }
  }, [])

  const HeightPreservingItem = React.useMemo(() => {
    return ({ children, ...props }) => {
      return (
        // the height is necessary to prevent the item container from collapsing, which confuses Virtuoso measurements
        <div {...props} style={{ height: props['data-known-size'] || undefined }}>
          {children}
        </div>
      )
    }
  }, [])

  return (
    <div style={{ overflow: 'auto' }}>
      <ReactBeautifulDnd.DragDropContext onDragEnd={onDragEnd}>
        <ReactBeautifulDnd.Droppable
          droppableId="droppable"
          mode="virtual"
          renderClone={(provided, snapshot, rubric) => (
            <Item provided={provided} isDragging={snapshot.isDragging} item={items[rubric.source.index]} />
          )}
        >
          {(provided) => {
            return (
              <div ref={provided.innerRef}>
                <Virtuoso
                  useWindowScroll
                  components={{
                    Item: HeightPreservingItem,
                  }}
                  data={items}
                  itemContent={(index, item) => {
                    return (
                      <ReactBeautifulDnd.Draggable draggableId={item.id} index={index} key={item.id}>
                        {(provided) => <Item provided={provided} item={item} isDragging={false} />}
                      </ReactBeautifulDnd.Draggable>
                    )
                  }}
                />
              </div>
            )
          }}
        </ReactBeautifulDnd.Droppable>
      </ReactBeautifulDnd.DragDropContext>
    </div>
  )
}
```
