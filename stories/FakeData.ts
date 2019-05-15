import faker from 'faker'

export interface TUser {
  name: string
  initials: string
  description: string
  bgColor: string
  fgColor: string
  longText: string
  avatar: string
}

interface TGroupRecord {
  type: 'group'
  letter: string
}

interface TUserRecord {
  type: 'user'
  user: TUser
}

const generated: TUser[] = []

export const getUser = (index: number): TUser => {
  if (!generated[index]) {
    let firstName = faker.name.firstName()
    let lastName = faker.name.lastName()
    generated[index] = {
      name: `${firstName} ${lastName}`,
      initials: `${firstName.substr(0, 1)}${lastName.substr(0, 1)}`,
      description: faker.company.catchPhrase(),
      bgColor: faker.commerce.color(),
      fgColor: faker.commerce.color(),
      longText: faker.lorem.paragraphs(4),
      avatar: faker.internet.avatar(),
    }
  }
  return generated[index]
}

export const generateGroupedUsers = () => {
  const users: TUser[] = []
  for (let i = 0, max = 200; i < max; i++) {
    users.push(getUser(i))
  }

  users.sort((a, b) => {
    if (a.name < b.name) {
      return -1
    }
    if (a.name > b.name) {
      return 1
    }
    return 0
  })

  const usersWithGroups: (TGroupRecord | TUserRecord)[] = []
  const groupIndices: number[] = []

  let currentFirstLetter = ''

  let i = 0
  for (var user of users) {
    const firstLetter = user.name[0]

    if (firstLetter !== currentFirstLetter) {
      usersWithGroups.push({
        type: 'group',
        letter: firstLetter,
      })
      currentFirstLetter = firstLetter
      groupIndices.push(i)
      i++
    }

    usersWithGroups.push({ type: 'user', user: user })
    i++
  }

  return {
    usersWithGroups,
    groupIndices,
  }
}
