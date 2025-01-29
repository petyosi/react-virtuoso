import * as React from 'react'
import { GroupedVirtuoso } from '../src'

const firstGroupCountMock = 2
let mock = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]
mock = [{ id: 1 }, { id: 2 }]

export function Example() {
  const [data, setData] = React.useState(mock)

  const removeLastItem = () => {
    setData((prev) => prev.slice(0, -1))
  }

  const addLastItem = () => {
    setData((prev) => [...prev, { id: data.length + 1 }])
  }

  const groupCounts = React.useMemo(() => {
    if (data.length > firstGroupCountMock) {
      return [firstGroupCountMock, data.length - firstGroupCountMock]
    }
    return [data.length]
  }, [data])

  return (
    <div>
      <GroupedVirtuoso
        context={{ data }}
        // groupCounts={[data.length]}
        groupCounts={groupCounts}
        itemContent={(index, _, __, { data }) => {
          return <div style={{ height: '20px' }}>{data[index]?.id}</div>
        }}
        groupContent={(index) => <div style={{ height: '30px', color: '#fff', backgroundColor: 'blue' }}>Group: {index}</div>}
        style={{ height: '300px', border: '1px dashed #ccc' }}
        alignToBottom
      />
      <button onClick={addLastItem}>add last item</button>
      <button onClick={removeLastItem}>remove last item</button>
    </div>
  )
}
