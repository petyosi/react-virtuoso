---
id: grid-responsive-columns
title: Grid with Responsive Columns
sidebar_label: Responsive Columns
slug: /grid-responsive-columns/
---

The `VirtuosoGrid` component displays **equally sized items**, while supporting multiple items per row.

The component provides no styling out of the box; the styling and the layout of the items can be specified by passing two properties - `itemClassName` and `listClassName`. 
Alternatively, you can use styled components and pass them as `components.Item` and `components.List`. 
Either way, it is up to you to implement the layout with Flexbox or CSS grid. You can use plain old CSS or CSS in JS - the example uses Emotion.

### Responsive Layout

You can safely use media queries, `min-width`, percentages etc. in the item layout definitions. 
The grid observes the container / item dimensions and recalculates the scroll size accordingly.

Resize your browser and scroll around - the items reposition correctly.

```jsx live
() => {
  const ItemContainer = styled.div`
    padding: 0.5rem;
    width: 33%;
    display: flex;
    flex: none;
    align-content: stretch;

    @media (max-width: 1024px) {
      width: 50%;
    }

    @media (max-width: 480px) {
      width: 100%;
    }
  `;

  const ItemWrapper = styled.div`
    flex: 1;
    text-align: center;
    font-size: 80%;
    padding: 1rem 1rem;
    border: 1px solid var(--ifm-hr-border-color);
    white-space: nowrap;
  `;

  const ListContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
  `;

  return (
    <VirtuosoGrid
      totalCount={10000}
      overscan={200}
      components={{
            Item: ItemContainer,
            List: ListContainer
      }}
      item={(index) => <ItemWrapper>Item {index}</ItemWrapper>}
      scrollSeek={{
        enter: (velocity) => Math.abs(velocity) > 200,
        exit: (velocity) => Math.abs(velocity) < 30,
        change: (_, range) => console.log({ range }),
        placeholder: ({ height, index }) => (
          <ItemContainer><ItemWrapper>{"--"}</ItemWrapper></ItemContainer>
        ),
      }}
    />
  )
}
```
