# Reactive Engine Query

`@virtuoso.dev/reactive-engine-query` adds data fetching to [`@virtuoso.dev/reactive-engine-core`](https://www.npmjs.com/package/@virtuoso.dev/reactive-engine-core). Queries and mutations are reactive nodes: parameters flow in, and pending/success/error results flow out to the rest of the graph.

## Installation

```bash
npm install @virtuoso.dev/reactive-engine-core @virtuoso.dev/reactive-engine-query
```

## Quick Example

```ts
import { Query } from '@virtuoso.dev/reactive-engine-query'

interface Task {
  id: string
  title: string
}

export const tasksQuery = Query<{ listId: string }, Task[]>({
  queryFn: async ({ listId }, signal) => {
    const res = await fetch(`/api/tasks?listId=${listId}`, { signal })
    if (!res.ok) {
      throw new Error('Failed to fetch tasks')
    }
    return res.json()
  },
  initialParams: { listId: '' },
})
```

## Features

- `Query` - parameterized async reads with abort signal support, retries, and typed pending/success/error results
- `Mutation` - async writes with typed idle/pending/success/error results
- `executeWithRetry` / `defaultRetryDelay` - retry utilities used by both

## License

MIT
