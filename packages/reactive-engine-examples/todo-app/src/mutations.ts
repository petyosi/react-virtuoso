import { Cell, e } from '@virtuoso.dev/reactive-engine-core'
import { ConcurrentMutation, Mutation } from '@virtuoso.dev/reactive-engine-query'

import { listsQuery, tasksQuery } from './queries'

import type { List, Task } from './types'
import type { ConcurrentMutationState, QueryResult } from '@virtuoso.dev/reactive-engine-query'

const API_BASE = 'http://localhost:3001'

export const editingId$ = Cell<string | null>(null)
// The create forms keep their text until the server accepts it, so a failed create does not lose what was typed.
export const newListName$ = Cell('')
export const newTaskDescription$ = Cell('')

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
    engine.pubIn({ [editingId$]: null, [newListName$]: '' })
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
  onSuccess: (_data, _params, engine) => {
    // The row hides while its result is success; the result is dismissed once the refetched data no longer has it.
    engine.pub(listsQuery.refetch$)
  },
})

e.sub(listsQuery.data$, (result, engine) => {
  if (result.type !== 'success') {
    return
  }
  const present = new Set(result.data.map((list) => list.id))
  for (const [id, state] of engine.getValue(deleteListMutation.status$)) {
    if (state.isSuccess && !present.has(id)) {
      engine.pub(deleteListMutation.dismiss$, id)
    }
  }
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
    engine.pub(newTaskDescription$, '')
    engine.pub(tasksQuery.refetch$)
  },
})

// Each write sends only the field it changes, so saving a description cannot revert a toggle that is still in flight,
// and a toggle cannot revert a description.
const patchTask = async (id: number, fields: Partial<Omit<Task, 'id'>>, signal: AbortSignal): Promise<Task> => {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
    signal,
  })
  if (!res.ok) {
    throw new Error('Failed to update task')
  }
  return res.json()
}

// Editing a description is a one-shot action per task: Save is disabled while the task saves.
export const updateTaskMutation = Mutation<{ id: number; description: string }, Task, number>({
  mutationFn: ({ id, description }, signal) => patchTask(id, { description }, signal),
  key: ({ id }) => id,
  onSuccess: (_task, _params, engine) => {
    engine.pub(tasksQuery.refetch$)
  },
})

/** A toggle carries the whole value of the one field it writes, which the overlay recipe needs. */
export interface TaskDone {
  done: boolean
  id: number
}

// Every click on the checkbox carries the new state, so clicks can overlap: the latest value wins.
export const toggleTaskMutation = ConcurrentMutation<TaskDone, Task, number>({
  mutationFn: ({ id, done }, signal) => patchTask(id, { done }, signal),
  concurrency: 'coalesce',
  key: ({ id }) => id,
  onSuccess: (_task, _params, engine) => {
    engine.pub(tasksQuery.refetch$)
  },
})

/** The optimistic `done` value of a task: the overlay recipe from the query docs. */
export function overlayDone(
  state: ConcurrentMutationState<TaskDone, Task, number> | undefined,
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

/** True when the newest toggle outcome for a task is a failure. A tie counts as a failure. */
export function toggleFailed(state: ConcurrentMutationState<TaskDone, Task, number> | undefined): boolean {
  const failure = state?.failures.at(-1)
  return failure !== undefined && (state?.lastSuccess == null || failure.settledAt >= state.lastSuccess.settledAt)
}

export const deleteTaskMutation = Mutation<{ id: number }, void, number>({
  mutationFn: async ({ id }, signal) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE', signal })
    if (!res.ok) {
      throw new Error('Failed to delete task')
    }
  },
  key: ({ id }) => id,
  onSuccess: (_data, _params, engine) => {
    engine.pub(tasksQuery.refetch$)
  },
})

e.sub(tasksQuery.data$, (result, engine) => {
  if (result.type !== 'success') {
    return
  }
  const present = new Set(result.data.map((task) => task.id))
  for (const [id, state] of engine.getValue(deleteTaskMutation.status$)) {
    if (state.isSuccess && !present.has(id)) {
      engine.pub(deleteTaskMutation.dismiss$, id)
    }
  }
})
