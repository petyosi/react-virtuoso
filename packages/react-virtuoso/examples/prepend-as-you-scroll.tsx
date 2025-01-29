import { faker } from '@faker-js/faker'
import { useCallback, useState } from 'react'

import { Virtuoso } from '../src'

const generated: ReturnType<typeof user>[] = []

export function toggleBg(index: number) {
  return index % 2 ? '#f5f5f5' : 'white'
}

export function user(index = 0) {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()

  return {
    bgColor: toggleBg(index),
    description: faker.lorem.sentence(10),
    index: index + 1,
    initials: `${firstName.substring(0, 1)}${lastName.substring(0, 1)}`,
    jobTitle: faker.name.jobTitle(),
    longText: faker.lorem.paragraphs(1),
    name: `${firstName} ${lastName}`,
  }
}

export const getUser = (index: number) => {
  if (!generated[index]) {
    generated[index] = user(index)
  }

  return generated[index]
}

export function Example() {
  const START_INDEX = 10000
  const INITIAL_ITEM_COUNT = 100

  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX)
  const [users, setUsers] = useState(() => generateUsers(INITIAL_ITEM_COUNT, START_INDEX))

  const prependItems = useCallback(() => {
    const usersToPrepend = 20
    const nextFirstItemIndex = firstItemIndex - usersToPrepend

    setTimeout(() => {
      setFirstItemIndex(() => nextFirstItemIndex)
      setUsers(() => [...generateUsers(usersToPrepend, nextFirstItemIndex), ...users])
    }, 100)

    return false
  }, [firstItemIndex, users, setUsers])

  return (
    <Virtuoso
      data={users}
      firstItemIndex={firstItemIndex}
      increaseViewportBy={{ bottom: 0, top: 1500 }}
      initialTopMostItemIndex={INITIAL_ITEM_COUNT - 1}
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
      startReached={prependItems}
      style={{ height: 400 }}
    />
  )
}

function generateUsers(length: number, startIndex = 0) {
  return Array.from({ length }).map((_, i) => getUser(i + startIndex))
}
