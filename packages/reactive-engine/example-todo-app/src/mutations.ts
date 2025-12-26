import { Cell, e, Mutation } from '../../src'
import { listsQuery, tasksQuery } from './queries'
import type { List, Task } from './types'

const API_BASE = 'http://localhost:3001'

// List mutations
export const createListMutation = Mutation<{ name: string }, List>({
  mutationFn: async ({ name }) => {
    const res = await fetch(`${API_BASE}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error('Failed to create list')
    return res.json()
  },
})

export const updateListMutation = Mutation<{ id: string; name: string }, List>({
  mutationFn: async ({ id, name }) => {
    const res = await fetch(`${API_BASE}/lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error('Failed to update list')
    return res.json()
  },
})

export const deleteListMutation = Mutation<{ id: string }, void>({
  mutationFn: async ({ id }) => {
    const res = await fetch(`${API_BASE}/lists/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete list')
  },
})

// Task mutations
export const createTaskMutation = Mutation<{ listId: string; description: string; done: boolean }, Task>({
  mutationFn: async ({ listId, description, done }) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, description, done }),
    })
    if (!res.ok) throw new Error('Failed to create task')
    return res.json()
  },
})

export const updateTaskMutation = Mutation<{ id: number; listId: string; description: string; done: boolean }, Task>({
  mutationFn: async ({ id, listId, description, done }) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, description, done }),
    })
    if (!res.ok) throw new Error('Failed to update task')
    return res.json()
  },
})

export const deleteTaskMutation = Mutation<{ id: number }, void>({
  mutationFn: async ({ id }) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete task')
  },
})

export const editingId$ = Cell<string | null>(null)

e.sub(createListMutation.data$, (data, engine) => {
  if (data.type === 'success') {
    engine.pubIn({
      [editingId$]: null,
    })
  }
})

e.link(
  e.pipe(
    e.merge(createListMutation.data$, updateListMutation.data$, deleteListMutation.data$),
    e.filter((data) => data.type === 'success'),
    e.map(() => undefined, false),
  ),
  listsQuery.refetch$,
)

e.link(
  e.pipe(
    e.merge(createTaskMutation.data$, updateTaskMutation.data$, deleteTaskMutation.data$),
    e.filter((data) => data.type === 'success'),
    e.map(() => undefined, false),
  ),
  tasksQuery.refetch$,
)
