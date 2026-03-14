import { useState } from 'react'

import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

function Component({ count: initialCount }: { count: number }) {
  const [count, setCount] = useState(initialCount)
  return (
    <div>
      <span>Count is {count}</span>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  )
}

test('counter button increments the count', async () => {
  const screen = await render(<Component count={1} />)

  await screen.getByRole('button', { name: 'Increment' }).click()

  await expect.element(screen.getByText('Count is 2')).toBeVisible()
})
