import { useCallback, useState } from 'react'
import * as React from 'react'
import { Virtuoso } from '../src/'
import faker from 'faker'

function toggleBg(index: number) {
  return index % 2 ? 'var(--ifm-background-color)' : 'var(--ifm-color-emphasis-200)'
}

function user(index = 0) {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()

  return {
    index: index + 1,
    bgColor: toggleBg(index),
    name: `${firstName} ${lastName}`,
    initials: `${firstName.substr(0, 1)}${lastName.substr(0, 1)}`,
    jobTitle: faker.name.jobTitle(),
    description: faker.lorem.sentence(10),
    longText: faker.lorem.paragraphs(1),
  }
}

const generated: ReturnType<typeof user>[] = []

const generateUsers = (length: number, startIndex = 0) => {
  return Array.from({ length }, (_, i) => getUser(i + startIndex))
}

const getUser = (index: number) => {
  if (!generated[index]) {
    generated[index] = user(index)
  }

  return generated[index]
}

export default function App() {
  const START_INDEX = 10000
  const INITIAL_ITEM_COUNT = 20

  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX)
  const [users, setUsers] = useState(() => generateUsers(INITIAL_ITEM_COUNT, START_INDEX))

  const prependItems = useCallback(() => {
    const usersToPrepend = 20
    const nextFirstItemIndex = firstItemIndex - usersToPrepend

    setTimeout(() => {
      setFirstItemIndex(() => nextFirstItemIndex)
      setUsers(() => [...generateUsers(usersToPrepend, nextFirstItemIndex), ...users])
    }, 5)

    return false
  }, [firstItemIndex, users, setUsers])

  return (
    <Virtuoso
      style={{ height: 500 }}
      components={{
        Header: () => <div style={{ textAlign: 'center', padding: '1rem' }}>Loading...</div>,
      }}
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={INITIAL_ITEM_COUNT - 1}
      data={users}
      startReached={prependItems}
      itemContent={(_, user) => {
        return (
          <div style={{ backgroundColor: user.bgColor, padding: '1rem 0.5rem' }}>
            <h4>
              {user.index}. {user.name}
            </h4>
            <div style={{ marginTop: '1rem' }}>{user.description}</div>
          </div>
        )
      }}
    />
  )
}
