import { Query } from '@virtuoso.dev/reactive-engine-query'
import type { List, Task } from './types'

const API_BASE = 'http://localhost:3001'

export const listsQuery = Query<void, List[]>({
  queryFn: async (_, signal) => {
    const res = await fetch(`${API_BASE}/lists`, { signal })
    if (!res.ok) throw new Error('Failed to fetch lists')
    return res.json()
  },
  initialParams: undefined,
})

export const tasksQuery = Query<{ listId: string }, Task[]>({
  queryFn: async ({ listId }, signal) => {
    const res = await fetch(`${API_BASE}/tasks?listId=${listId}`, { signal })
    if (!res.ok) throw new Error('Failed to fetch tasks')
    return res.json().then((data) => data.filter((task: Task) => task.listId === listId))
  },
  initialParams: { listId: '' },
})
