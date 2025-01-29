import { faker } from '@faker-js/faker'
import React from 'react'

import { Virtuoso } from '../src'

function toggleBg(index: number) {
  return index % 2 ? 'var(--ifm-background-color)' : 'var(--ifm-color-emphasis-200)'
}

function user(index = 0) {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()

  return {
    bgColor: toggleBg(index),
    description: faker.lorem.sentence(10),
    index: index + 1,
    initials: `${firstName.substr(0, 1)}${lastName.substr(0, 1)}`,
    jobTitle: faker.name.jobTitle(),
    longText: faker.lorem.paragraphs(1),
    name: `${firstName} ${lastName}`,
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

export function Example() {
  const START_INDEX = 10000
  const INITIAL_ITEM_COUNT = 20

  const [firstItemIndex, setFirstItemIndex] = React.useState(START_INDEX)
  const [users, setUsers] = React.useState(() => generateUsers(INITIAL_ITEM_COUNT, START_INDEX))

  const prependItems = React.useCallback(() => {
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
      components={{
        Header: () => <div style={{ padding: '1rem', textAlign: 'center' }}>Loading...</div>,
      }}
      data={users}
      firstItemIndex={firstItemIndex}
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
      style={{ height: 500 }}
    />
  )
}
