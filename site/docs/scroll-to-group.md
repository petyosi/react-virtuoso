---
id: scroll-to-group
title: Scroll to Group
sidebar_label: Scroll to Group
slug: /scroll-to-group/
---

This example re-creates the UI of the iOS contacts listview. 

```jsx live
() => {
  const { users, groups, groupCounts } = generateGroupedUsers(500)
  const virtuoso = useRef(null)

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1 }}>
        <GroupedVirtuoso
          ref={virtuoso}
          groupCounts={groupCounts}
          groupContent={index => {
          return <div style={{ 
            backgroundColor: 'var(--ifm-background-color)', 
            padding: '0.3rem 1rem'
          }}>{groups[index]}</div>
          }}
          itemContent={index => {
            return <div style={{ padding: '0.5rem 1rem', backgroundColor: toggleBg(index) }}>
            <h4>{users[index].name}</h4>

            <p style={{ marginBottom: 0 }}>{users[index].description}</p>
            </div>
          }}
        />
      </div>

      <ul
        style={{
          marginLeft: '0.5rem',
          paddingLeft: '0',
          listStyle: 'none',
          fontSize: '0.8rem',
        }}
      >
        {groupCounts
          .reduce(
            ({ firstItemsIndexes, offset }, count) => {
              return {
                firstItemsIndexes: [...firstItemsIndexes, offset],
                offset: offset + count,
              }
            },
            { firstItemsIndexes: [], offset: 0 }
          )
          .firstItemsIndexes.map((itemIndex, index) => (
            <li key={index}>
              <a
                href="#"
                onClick={e => {
                  e.preventDefault()
                  virtuoso.current.scrollToIndex({
                    index: itemIndex,
                  })
                }}
              >
                {groups[index]}
              </a>
            </li>
          ))}
      </ul>
    </div>
  )
}
```
