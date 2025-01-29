import React, { useState } from 'react'
import { DragDropContext, Draggable, DraggableProvided, Droppable, DropResult } from 'react-beautiful-dnd'

import { Components, Virtuoso } from '../src'

interface Item {
  id: string
  text: string
}
export function Example() {
  const [items, setItems] = useState(() => {
    return Array.from({ length: 1000 }, (_, k) => ({
      id: `id:${k}`,
      text: `item ${k}`,
    }))
  })

  const reorder = React.useCallback((list: Item[], startIndex: number, endIndex: number) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
  }, [])

  const onDragEnd = React.useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return
      }
      if (result.source.index === result.destination.index) {
        return
      }

      setItems((items) => reorder(items, result.source.index, result.destination!.index))
    },
    [setItems, reorder]
  )

  const Item = React.useMemo(() => {
    return ({ isDragging, item, provided }: { isDragging: boolean; item: Item; provided: DraggableProvided }) => {
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

  const HeightPreservingItem: Components<{ id: string; text: string }>['Item'] = React.useMemo(() => {
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
    <div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="droppable"
          mode="virtual"
          renderClone={(provided, snapshot, rubric) => (
            <Item isDragging={snapshot.isDragging} item={items[rubric.source.index]} provided={provided} />
          )}
        >
          {(provided) => {
            return (
              <Virtuoso<{ id: string; text: string }>
                components={{
                  Item: HeightPreservingItem,
                }}
                scrollerRef={provided.innerRef as any}
                data={items}
                itemContent={(index, item) => {
                  return (
                    <Draggable draggableId={item.id} index={index} key={item.id}>
                      {(provided) => <Item isDragging={false} item={item} provided={provided} />}
                    </Draggable>
                  )
                }}
                style={{ height: 500, width: 300 }}
              />
            )
          }}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
