import { Cell } from '@virtuoso.dev/reactive-engine-core'
import { ConcurrentMutation, Mutation } from '@virtuoso.dev/reactive-engine-query'

import { listsQuery, tasksQuery } from './queries'

import type { List, Task } from './types'
import type { ConcurrentMutationState, QueryResult } from '@virtuoso.dev/reactive-engine-query'

const API_BASE = 'http://localhost:3001'

export const editingId$ = Cell<string | null>(null)

// One form: one record, so a second submit while the first is saving is a duplicate and is ignored.
export const createListMutation = Mutation<{ name: string }, List>({
  mutationFn: async ({ name }, signal) => {
    const res = await fetch(`${API_BASE}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      signal,
    })
    if (!res.ok) {
      throw new Error('Failed to create list')
    }
    return res.json()
  },
  key: false,
  onSuccess: (_list, _params, engine) => {
    engine.pubIn({ [editingId$]: null })
    engine.pub(listsQuery.refetch$)
  },
})

// Per-row actions: one record per list, so different rows save independently.
export const updateListMutation = Mutation<{ id: string; name: string }, List, string>({
  mutationFn: async ({ id, name }, signal) => {
    const res = await fetch(`${API_BASE}/lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      signal,
    })
    if (!res.ok) {
      throw new Error('Failed to update list')
    }
    return res.json()
  },
  key: ({ id }) => id,
  onSuccess: (_list, _params, engine) => {
    engine.pub(listsQuery.refetch$)
  },
})

export const deleteListMutation = Mutation<{ id: string }, void, string>({
  mutationFn: async ({ id }, signal) => {
    const res = await fetch(`${API_BASE}/lists/${id}`, { method: 'DELETE', signal })
    if (!res.ok) {
      throw new Error('Failed to delete list')
    }
  },
  key: ({ id }) => id,
  onSuccess: (_data, { id }, engine) => {
    engine.pub(listsQuery.refetch$)
    // The row is gone, so its result is no longer shown anywhere.
    engine.pub(deleteListMutation.dismiss$, id)
  },
})

export const createTaskMutation = Mutation<{ listId: string; description: string; done: boolean }, Task>({
  mutationFn: async ({ listId, description, done }, signal) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, description, done }),
      signal,
    })
    if (!res.ok) {
      throw new Error('Failed to create task')
    }
    return res.json()
  },
  key: false,
  onSuccess: (_task, _params, engine) => {
    engine.pub(tasksQuery.refetch$)
  },
})

const putTask = async (task: Task, signal: AbortSignal): Promise<Task> => {
  const { id, listId, description, done } = task
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listId, description, done }),
    signal,
  })
  if (!res.ok) {
    throw new Error('Failed to update task')
  }
  return res.json()
}

// Editing a description is a one-shot action per task: Save is disabled while the task saves.
export const updateTaskMutation = Mutation<Task, Task, number>({
  mutationFn: putTask,
  key: ({ id }) => id,
  onSuccess: (_task, _params, engine) => {
    engine.pub(tasksQuery.refetch$)
  },
})

// Every click on the checkbox carries the new state, so clicks can overlap: the latest value wins.
export const toggleTaskMutation = ConcurrentMutation<Task, Task, number>({
  mutationFn: putTask,
  concurrency: 'coalesce',
  key: ({ id }) => id,
  onSuccess: (_task, _params, engine) => {
    engine.pub(tasksQuery.refetch$)
  },
})

/** The optimistic `done` value of a task: the overlay recipe from the query docs. */
export function overlayDone(
  state: ConcurrentMutationState<Task, Task, number> | undefined,
  query: QueryResult<Task[]>,
  task: Task
): boolean {
  const newest = state?.waiting.at(-1) ?? state?.running.at(-1)
  if (newest !== undefined) {
    return newest.done
  }
  const last = state?.lastSuccess
  if (last !== undefined && last !== null && (query.dataUpdatedAt === null || last.settledAt >= query.dataUpdatedAt)) {
    return last.params.done
  }
  return task.done
}

export const deleteTaskMutation = Mutation<{ id: number }, void, number>({
  mutationFn: async ({ id }, signal) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE', signal })
    if (!res.ok) {
      throw new Error('Failed to delete task')
    }
  },
  key: ({ id }) => id,
  onSuccess: (_data, { id }, engine) => {
    engine.pub(tasksQuery.refetch$)
    engine.pub(deleteTaskMutation.dismiss$, id)
  },
})
