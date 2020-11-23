---
id: react-sortable-hoc
title: React Sortable HOC
sidebar_label: React Sortable HOC
slug: /react-sortable-hoc/
---

The example below integrates the library with [React Sortable HOC](https://github.com/clauderic/react-sortable-hoc). 
Drag any of the items around - dropping it outputs the information in the console.


The example is contributed by [mitchellwarr](https://github.com/mitchellwarr).

```jsx live
() => {
  const ItemContainerSortable = ReactSortableHOC.sortableElement((props) => <div {...props} />);

  const ListContainerSortable = ReactSortableHOC.sortableContainer(({ listRef, ...props }) => (
      <div ref={listRef} {...props} />
    )
  );

  return (
    <Virtuoso
      data={generateRandomItems(100)}
      components={{
        List: React.forwardRef((props, ref) => {
          return (
            <ListContainerSortable
              {...props}
              listRef={ref}
              onSortEnd={(...args) => console.log(args)}
            />
          );
        }),
        Item: (props) => {
            const { ["data-index"]: index } = props;
            return <ItemContainerSortable index={index} {...props} />;
        }
      }}
      itemContent={(index, item) => (
        <div
          style={{
            padding: "1rem 0",
          }}
        >
          <h4>{item.text}</h4>

          {item.longText}
        </div>
      )}
    />
  )
}
```
