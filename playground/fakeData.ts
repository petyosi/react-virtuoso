import faker from 'faker'
import { groupBy } from 'lodash'

const generated = []

export const getUser = index => {
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

export const generateGroupedUsers = max => {
  const users = []
  for (let i = 0; i < max; i++) {
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

  const groupedUsers = groupBy(users, user => user.name[0])
  const groupCounts = Object.values(groupedUsers).map(users => users.length)
  const groups = Object.keys(groupedUsers)

  return { users, groupCounts, groups }
}
