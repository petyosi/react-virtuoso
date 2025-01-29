import { useState } from 'react'

import { Virtuoso } from '../src'

interface User {
  name: string
}

const users: User[] = [
  {
    name: 'Sheila Robel',
  },
  {
    name: 'Brian Bernier',
  },
  {
    name: 'Destiny Hegmann',
  },
  {
    name: 'Demetrius Schaden',
  },
  {
    name: 'Tara Smitham',
  },
]

export function Example() {
  const [list, setList] = useState(users)

  const remove = (user: User) => {
    setList((prevList) => prevList.filter((u) => u.name !== user.name))
  }

  return (
    <Virtuoso
      data={list}
      fixedItemHeight={80}
      itemContent={(_index, user) => (
        <div>
          <h4>
            {user.name}
            <button
              onClick={() => {
                remove(user)
              }}
            >
              Close
            </button>
          </h4>
        </div>
      )}
      itemsRendered={(props) => {
        console.log('items rendered', props)
      }}
      style={{ height: 1000 }}
    />
  )
}
