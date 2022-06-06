import faker from 'faker'
import { groupBy } from 'lodash'
import React from 'react'

const generated: Array<ReturnType<typeof user>> = []

export function toggleBg(index: number) {
  return index % 2 ? '#f5f5f5' : 'white'
}

export function user(index = 0) {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()

  return {
    index: index + 1,
    bgColor: toggleBg(index),
    name: `${firstName} ${lastName}`,
    initials: `${firstName.substring(0, 1)}${lastName.substring(0, 1)}`,
    jobTitle: faker.name.jobTitle(),
    description: faker.lorem.sentence(10),
    longText: faker.lorem.paragraphs(1),
  }
}

export const getUser = (index: number) => {
  if (!generated[index]) {
    generated[index] = user(index)
  }

  return generated[index]
}

const userSorter = (a: { name: string }, b: { name: string }) => {
  if (a.name < b.name) {
    return -1
  }
  if (a.name > b.name) {
    return 1
  }
  return 0
}

export function generateUsers(length: number, startIndex = 0) {
  return Array.from({ length }).map((_, i) => getUser(i + startIndex))
}

export function generateGroupedUsers(length: number) {
  const users = Array.from({ length })
    .map((_, i) => getUser(i))
    .sort(userSorter)
  const groupedUsers = groupBy(users, (user) => user.name[0])
  const groupCounts = Object.values(groupedUsers).map((users) => users.length)
  const groups = Object.keys(groupedUsers)

  return { users, groupCounts, groups }
}

export const avatar = () =>
  React.createElement(
    'div',
    {
      style: {
        backgroundColor: 'blue',
        borderRadius: '50%',
        width: 50,
        height: 50,
        paddingTop: 15,
        paddingLeft: 15,
        color: 'white',
        boxSizing: 'border-box',
      },
    },
    'AB'
  )

export const avatarPlaceholder = (text = ' ') =>
  React.createElement(
    'div',
    {
      style: {
        backgroundColor: '#eef2f4',
        borderRadius: '50%',
        width: 50,
        height: 50,
      },
    },
    text
  )
