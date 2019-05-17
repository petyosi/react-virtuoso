import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react'
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
  for (let index = 0; index < 1000; index++) {
    groupCounts.push(10)
  }

  return (
    <>
      <ExampleInfo>
        <ExampleTitle>Grouped 10 000 numbers</ExampleTitle>
        <p>
          The simplest possible grouping scenario; this example uses the <code>GroupedVirtuoso</code> component to
          render 10 000 items in groups of 10.
        </p>
      </ExampleInfo>

      <GroupedVirtuoso
        style={{ height: '500px', width: '200px' }}
        groupCounts={groupCounts}
        group={index => {
          return (
            <ExampleGroup>
              Group {index * 10} &ndash; {index * 10 + 10}
            </ExampleGroup>
          )
        }}
        item={(index, groupIndex) => {
          return (
            <ExampleListItem even={index % 2 === 0}>
              <ExampleUserInfo title={`Number ${index}`}>
                {index} (group {groupIndex})
              </ExampleUserInfo>
            </ExampleListItem>
          )
        }}
      />
    </>
  )
}

group.add('Grouped Numbers', () => <GroupedNumbers />)

const GroupedUsers = () => {
  // the generateGroupedUsers is a dummy implementation that builds grouped data
  // the users variable contains 500 user records, sorted by name
  // the groups variable contains the first letter groups -> ['A', 'B', 'C'], etc.
  // finally, the groupCounts specifies how many items each group has -> [ 20, 30, 15, 10 ], etc.
  const { users, groups, groupCounts } = generateGroupedUsers(500)

  return (
    <>
      <ExampleInfo>
        <ExampleTitle>Grouped by First Letter</ExampleTitle>
        <p>
          This is a slightly more complex <code>GroupedVirtuoso</code> example, which displays 500 user records, grouped
          by the first letter of their name.
        </p>
        <p>Check the comments in the source code pane for more details.</p>
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

group.add('Grouped by First Letter', () => <GroupedUsers />)

// Slices the total groups to the groups which contain the items so far
// for example, if you have [10, 10, 10, 10] groups in total, slicing them to 23 will result in [10, 10, 3]
const calculateGroupsSoFar = (totalGroups: number[], count: number): number[] => {
  const groups = []
  let i = 0
  do {
    const group = totalGroups[i]
    groups.push(Math.min(group, count))
    count -= group
    i++
  } while (count > 0 && i <= totalGroups.length)
  return groups
}

const GroupLoadOnDemand = () => {
  const { users, groups, groupCounts } = useMemo(() => generateGroupedUsers(500), [])

  const [currentGroupCounts, setCurrentGroupCounts] = useState<number[]>([])
  const loadedItems = useRef(0)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(() => {
    setLoading(true)

    // the set timeout call is just for example purposes. In the real world,
    // this can fetch and append data from a remote server.
    setTimeout(() => {
      loadedItems.current += 50
      setLoading(false)
      setCurrentGroupCounts(calculateGroupsSoFar(groupCounts, loadedItems.current))
    }, 500)
  }, [])

  useEffect(loadMore, [])

  return (
    <>
      <ExampleInfo>
        <ExampleTitle>Grouped by First Letter (Load on Demand)</ExampleTitle>
        <p>
          The <code>GroupedVirtuoso</code> component accepts a <code>footer</code> render prop, which can be used to
          host a load more button that appends more items to the existing ones.
        </p>
        <p>
          To add additional items to the groups, you should re-calculate the <code>groupCounts</code> property value
          with the group values of the newly loaded items. Check the source code of this example for a possible
          implementation.
        </p>
      </ExampleInfo>

      <GroupedVirtuoso
        style={{ height: '500px', width: '500px' }}
        groupCounts={currentGroupCounts}
        group={index => <ExampleGroup>Group {groups[index]}</ExampleGroup>}
        item={index => <UserItem user={users[index]} index={index} />}
        footer={() => {
          return (
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
              <button disabled={loading} onClick={loadMore}>
                {loading ? 'Loading...' : 'Press to load more'}
              </button>
            </div>
          )
        }}
      />
    </>
  )
}

group.add('Groups with load on demand', () => <GroupLoadOnDemand />)
