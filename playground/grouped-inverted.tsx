import { generateGroupedUsers } from './fakeData'
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { render } from 'react-dom'
import { GroupedVirtuoso } from '../src'

// Slices the total groups to the groups
// which contain the items so far
// for example, if you have [10, 10, 10, 10]
// groups in total, slicing them to 23 will result in [10, 10, 3]
const calculateGroupsSoFar = (totalGroups: Array<any>, count: number) => {
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

const App = () => {
  const { groups, groupCounts } = useMemo(() => generateGroupedUsers(500), [])

  const [currentGroupCounts, setCurrentGroupCounts] = useState([])
  const loadedItems = useRef(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setLoading] = useState(false)

  const loadMore = useCallback(() => {
    setLoading(true)

    // the set timeout call is just for example purposes.
    // In the real world,
    // this can fetch and append data from a remote server.
    setTimeout(() => {
      loadedItems.current += 50
      setLoading(false)
      setCurrentGroupCounts(calculateGroupsSoFar(groupCounts, loadedItems.current))
    }, 500)
  }, [])

  useEffect(loadMore, [])

  return (
    <GroupedVirtuoso
      style={{ height: '350px', width: '400px' }}
      groupCounts={currentGroupCounts}
      group={(index: number) => <div>Group {groups[index]}</div>}
      item={(index: number) => <div>User {index}</div>}
      initialTopMostItemIndex={45}
      endReached={index => {
        console.warn('index', index)
        loadMore()
      }}
      inverted={true}
    />
  )
}

render(<App />, document.getElementById('root'))
