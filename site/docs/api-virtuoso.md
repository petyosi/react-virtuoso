---
id: api-virtuoso
title: Virtuoso API
---

export const Property = ({ title, type, optional=false, children }) => {
  return (<div class="card shadow--lw property">
  <div class="card__header">
  <h3>{title}</h3>
  { optional ?  <span class="badge badge--primary">Required</span> : <span class="badge badge--secondary">Optional</span> }
  </div>
  <div class="card__body">
  <div><code>{type}</code></div>
  <div style={{ marginTop: '0.5rem' }}>{children}</div>
  </div>
  </div>)
}

## Hello world

  
<Property title="totalCount" type="number">
The total amount of items to be rendered.
</Property>

  ```jsx live
  <button 
  onClick={() => alert(1)}>
    Click Me
  </button>
  ```
   
<Property title="data" type="any[]">
The data items to be rendered. If <code>data</code> is set, the total count will be inferred from the length of the array.
</Property>

  
   
<Property title="overscan" type="number">
  Set the overscan property to make the component "chunk" the rendering of new items on scroll.
  The property causes the component to render more items than the necessary, but reduces the re-renders on scroll.
  <br />
  Setting <code>main: number, reverse: number</code> lets you extend the list in both the main and the reverse scrollable directions.
</Property>

  
<Property title="topItemCount" type="number">
Set the amount of items to remain fixed at the top of the list.
For a header that scrolls away when scrolling, check the <code>components.Header</code> property.
</Property>

  
<Property title="initialTopMostItemIndex" type="number">
Set to a value between 0 and totalCount - 1 to make the list start scrolled to that item.
</Property>
   

  
<Property title="initialItemCount" type="number">
Use for server-side rendering - if set, the list will render the specified amount of items
regardless of the container  item size.
</Property>
   
  
    Use the `components` property for advanced customization of the elements rendered by the list.
   
  components
 ListProps['components']

  
    Set the callback to specify the contents of the item.
   
  itemContent
 ListProps['itemContent']

  
    If specified, the component will use the function to generate the `key` property for each list item.
   
  computeItemKey
 ListProps['computeItemKey']

  
    By default, the component assumes the default item height from the first rendered item (rendering it as a "probe").
   
    If the first item turns out to be an outlier (very short or tall), the rest of the rendering will be slower,
    as multiple passes of rendering should happen for the list to fill the viewport.
   
    Setting `defaultItemHeight` causes the component to skip the "probe" rendering and use the property
    value as default height instead.
   
  defaultItemHeight
 ListProps['defaultItemHeight']

  
    Can be used to improve performance if the rendered items are of known size.
    Setting it causes the component to skip item measurements.
   
  fixedItemHeight
 ListProps['fixedItemHeight']

  
    Use to display placeholders if the user scrolls fast through the list.
   
    Set `components.ScrollSeekPlaceholder` to change the placeholder content.
   
  scrollSeekConfiguration
 ListProps['scrollSeekConfiguration']

  
    If set to true, the list automatically scrolls to bottom if the total count is changed.
   
  followOutput
 ListProps['followOutput']

  
    Set to customize the wrapper tag for the header and footer components (default is `div`).
   
  headerFooterTag
 ListProps['headerFooterTag']

  
    Use when implementing inverse infinite scrolling - decrease the value this property
    in combination with  `data` or `totalCount` to prepend items to the top of the list.
   
  firstItemIndex
 ListProps['firstItemIndex']

  
    Called when the list startsstops scrolling.
   
  isScrolling
 ListProps['isScrolling']

  
    Gets called when the user scrolls to the end of the list.
    Receives the last item index as an argument. Can be used to implement endless scrolling.
   
  endReached
 ListProps['endReached']

  
    Called when the user scrolls to the start of the list.
   
  startReached
 ListProps['startReached']

  
    Called with the new set of items each time the list items are rendered due to scrolling.
   
  rangeChanged
 ListProps['rangeChanged']

  
    Called with true  false when the list has reached the bottom / gets scrolled up.
    Can be used to load newer items, like `tail -f`.
   
  atBottomStateChange
 ListProps['atBottomStateChange']

  
    Called with `true`  `false` when the list has reached the top / gets scrolled down.
   
  atTopStateChange
 ListProps['atTopStateChange']

  
    Called when the total list height is changed due to new items or viewport resize.
   
  totalListHeightChanged
 ListProps['totalListHeightChanged']

  
    Called with the new set of items each time the list items are rendered due to scrolling.
   
  itemsRendered
 ListProps['itemsRendered']
