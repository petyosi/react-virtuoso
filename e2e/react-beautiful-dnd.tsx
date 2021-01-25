import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Virtuoso, Components } from '../src'
// import "./style.css";

// Generate our initial big data set
// Go on, make it 10,000 🤘
const initial = Array.from({ length: 1000 }, (_, k) => ({
  id: `id:${k}`,
  text: `item ${k}`,
}))

function reorder(list: typeof initial, startIndex: number, endIndex: number) {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

function getStyle({ provided, isDragging }) {
  const draggableStyle = provided.draggableProps.style

  const paddingBottom = 8
  const withSpacing = {
    ...draggableStyle,
    height: isDragging ? draggableStyle.height : undefined,
    paddingBottom,
  }
  return withSpacing
}

function Item({ provided, item, isDragging }) {
  return (
    <div
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      ref={provided.innerRef}
      style={getStyle({ provided, isDragging })}
      className={`item ${isDragging ? 'is-dragging' : ''}`}
    >
      {item.text}
    </div>
  )
}

export default function App() {
  const [items, setItems] = useState(initial)

  const onDragEnd = React.useCallback(
    (result: any) => {
      if (!result.destination) {
        return
      }
      if (result.source.index === result.destination.index) {
        return
      }

      // void setItems
      setItems(items => reorder(items, result.source.index, result.destination.index))
    },
    [setItems]
  )

  const HeightPreservingItem: Components['Item'] = React.useMemo(() => {
    return ({ children, ...props }) => {
      return (
        <div {...props} style={{ height: props['data-known-size'] || undefined }}>
          {children}
        </div>
      )
    }
  }, [])

  return (
    <div>
      <button
        onClick={() => {
          setItems(items => reorder(items, 0, 3))
        }}
      >
        Reorder
      </button>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="droppable"
          mode="virtual"
          renderClone={(provided, snapshot, rubric) => (
            <Item provided={provided} isDragging={snapshot.isDragging} item={items[rubric.source.index]} />
          )}
        >
          {provided => {
            console.log('foo')

            return (
              <Virtuoso
                components={{
                  Item: HeightPreservingItem,
                }}
                scrollerRef={ref => {
                  console.log('reffing', ref)
                  provided.innerRef(ref)
                }}
                data={items}
                style={{ width: 300, height: 500 }}
                itemContent={(index, item) => {
                  return (
                    <Draggable draggableId={item.id} index={index} key={item.id}>
                      {provided => <Item provided={provided} item={item} isDragging={false} />}
                    </Draggable>
                  )
                }}
              />
            )
          }}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
