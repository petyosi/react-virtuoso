---
id: scroll-to-group
title: Scroll to Group
sidebar_label: Scroll to Group
slug: /scroll-to-group/
sidebar_position: 5
---

This example re-creates the UI of the iOS contacts listview. 

```tsx live 
export default function App() {
  const { users, groups, groupCounts } = useMemo(() => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    
    const users = letters.flatMap((letter) => {
      return Array.from({ length: 20 }, (_, index) => ({
        name: `${letter} User ${index}`,
        initials: `${letter}${index}`,
        description: `Description for user ${index}`,
      }))
    })    

    const groups = letters.slice(0, 15)

    const groupCounts = letters.map((letter, index) => {
      return users.filter((user, userIndex) => user.name.startsWith(letter)).length
    })
    return { users, groups, groupCounts }
  }, [])
  const virtuoso = useRef(null)

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1 }}>
        <GroupedVirtuoso
          ref={virtuoso}
          groupCounts={groupCounts}
          groupContent={index => {
          return <div style={{ 
            backgroundColor: 'var(--ifm-color-content-inverse)', 
            padding: '0.3rem 1rem'
          }}>{groups[index]}</div>
          }}
          itemContent={index => {
            return <div style={{ padding: '0.5rem 1rem' }}>
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
