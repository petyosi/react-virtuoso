import React from 'react'
import { GroupedVirtuoso } from '../src/index'
import { generateGroupedUsers, TUser } from './FakeData'
import { ExampleListItem, ExampleAvatar, ExampleUserInfo, ExampleGroup } from './ExampleComponents'
import { storiesOf } from '@storybook/react'
import { ExampleInfo, ExampleTitle } from './ExampleInfo'

const group = storiesOf('Grouping', module)

const UserItem: React.FC<{ user: TUser; index: number }> = ({ user, index }) => {
  const title = `${index + 1}. ${user.name}`
  return (
    <ExampleListItem even={index % 2 === 0}>
      <ExampleAvatar style={{ color: user.fgColor, backgroundColor: user.bgColor }}>{user.initials}</ExampleAvatar>
      <ExampleUserInfo title={title}>{user.description}</ExampleUserInfo>
    </ExampleListItem>
  )
}

const GroupedNumbers = () => {
  const groupCounts = []
  for (let index = 0; index < 100; index++) {
    groupCounts.push(10)
  }

  return (
    <>
      <ExampleInfo>
        <ExampleTitle />
      </ExampleInfo>

      <GroupedVirtuoso
        style={{ height: '500px', width: '500px' }}
        groupCounts={groupCounts}
        group={index => {
          return (
            <ExampleGroup>
              Group {index * 10} - {index * 10 + 10}
            </ExampleGroup>
          )
        }}
        item={index => {
          return (
            <ExampleListItem even={index % 2 === 0}>
              <ExampleUserInfo title={`Number ${index}`}>{index}</ExampleUserInfo>
            </ExampleListItem>
          )
        }}
      />
    </>
  )
}

group.add('Grouped Items', () => <GroupedNumbers />)

const GroupedUsers = () => {
  const { users, groups, groupCounts } = generateGroupedUsers(500)

  return (
    <>
      <ExampleInfo>
        <ExampleTitle />
      </ExampleInfo>

      <GroupedVirtuoso
        style={{ height: '500px', width: '500px' }}
        groupCounts={groupCounts}
        group={index => {
          return <ExampleGroup>{groups[index]}</ExampleGroup>
        }}
        item={index => {
          return <UserItem user={users[index]} index={index} />
        }}
      />
    </>
  )
}

group.add('Grouped Users', () => <GroupedUsers />)
