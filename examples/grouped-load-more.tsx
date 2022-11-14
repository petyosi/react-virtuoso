import * as React from 'react'
import { Components, GroupedVirtuoso } from '../src'
import { useMemo, useRef, useState, useEffect } from 'react'
import faker from 'faker/dist/faker.js'
import { groupBy } from 'lodash'

const getUser = () => {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()
  return {
    name: `${firstName} ${lastName}`,
    initials: `${firstName.substr(0, 1)}${lastName.substr(0, 1)}`,
    description: faker.company.catchPhrase(),
    avatar: faker.internet.avatar(),
  }
}

type User = ReturnType<typeof getUser>

const sortUser = (a: User, b: User) => {
  if (a.name < b.name) {
    return -1
  }
  if (a.name > b.name) {
    return 1
  }
  return 0
}

const useGroupedUsers = (count: number) => {
  const allUsers = useMemo(() => new Array(count).fill(true).map(getUser).sort(sortUser), [count])

  const loadedCount = useRef(0)
  const loadedUsers = useRef<User[]>([])
  const groups = useRef<string[]>([])
  const [endReached, setEndReached] = useState(false)
  const [groupCounts, setGroupCounts] = useState<number[]>([])

  const loadMore = () => {
    if (!endReached) {
      setTimeout(() => {
        loadedCount.current += 50

        // in a real world scenario, you would fetch the next
        // slice and append it to the existing records
        loadedUsers.current = allUsers.slice(0, loadedCount.current)

        // the code below calculates the group counts
        // for the users loaded so far;
        // this should be performed on the server too
        const groupedUsers = groupBy(loadedUsers.current, (user) => user.name[0])
        groups.current = Object.keys(groupedUsers)
        setGroupCounts(Object.values(groupedUsers).map((users) => users.length))

        if (loadedCount.current === 500) {
          setEndReached(true)
        }
      }, 1500)
    }
  }

  return {
    loadMore,
    endReached,
    groupCounts,
    users: loadedUsers.current,
    groups: groups.current,
  }
}

const components: Components = {
  Footer: () => <div>Footer</div>,

  List: React.forwardRef(({ style, children }, listRef) => {
    return (
      <div ref={listRef} style={style}>
        {children}
      </div>
    )
  }),

  Item: ({ children, ...props }) => {
    return (
      <div {...props} style={{ margin: 0 }}>
        {children}
      </div>
    )
  },

  Group: ({ children, ...props }) => {
    return <div {...props}>{children}</div>
  },
}
const Style = { height: '350px', width: '400px' }

export default function App() {
  const { loadMore, groupCounts, users, groups } = useGroupedUsers(500)

  useEffect(loadMore, [loadMore])

  return (
    <GroupedVirtuoso
      components={components}
      style={Style}
      groupCounts={groupCounts}
      groupContent={(index) => <div>Group {groups[index]}</div>}
      overscan={400}
      endReached={loadMore}
      itemContent={(index) => (
        <div>
          <div>{users[index].initials}</div>
          <div>
            <strong>{users[index].name}</strong>
          </div>
          <div>{users[index].description}</div>
        </div>
      )}
    />
  )
}
