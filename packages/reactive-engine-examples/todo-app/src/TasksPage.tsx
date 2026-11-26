import { useState } from 'react'

import { useCell, useCellValue, usePublisher } from '@virtuoso.dev/reactive-engine-react'

import {
  createTaskMutation,
  deleteTaskMutation,
  newTaskDescription$,
  overlayDone,
  toggleFailed,
  toggleTaskMutation,
  updateTaskMutation,
} from './mutations'
import { listsQuery, tasksQuery } from './queries'
import { lists$ } from './routes'

import type { Task } from './types'
import type { RouteParams } from '@virtuoso.dev/reactive-engine-router'

export const TasksPage: React.ComponentType<RouteParams<'/lists/{id}'>> = ({ id }) => {
  const listId = id

  const listsData = useCellValue(listsQuery.data$)
  const tasksData = useCellValue(tasksQuery.data$)
  const createTask = usePublisher(createTaskMutation.mutate$)
  const creating = useCellValue(createTaskMutation.data$).isPending
  const updateTask = usePublisher(updateTaskMutation.mutate$)
  const updates = useCellValue(updateTaskMutation.status$)
  const toggleTask = usePublisher(toggleTaskMutation.mutate$)
  const toggles = useCellValue(toggleTaskMutation.status$)
  const dismissToggle = usePublisher(toggleTaskMutation.dismiss$)
  const deleteTask = usePublisher(deleteTaskMutation.mutate$)
  const deletes = useCellValue(deleteTaskMutation.status$)
  const goToLists = usePublisher(lists$)

  const [newTaskDescription, setNewTaskDescription] = useCell(newTaskDescription$)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingDescription, setEditingDescription] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskDescription.trim()) {
      // The input clears when the task is created, in createTaskMutation's onSuccess.
      createTask({ listId, description: newTaskDescription, done: false })
    }
  }

  const handleEdit = (task: Task) => {
    setEditingId(task.id)
    setEditingDescription(task.description)
  }

  const handleUpdate = (task: Task) => {
    if (editingDescription.trim()) {
      updateTask({ id: task.id, description: editingDescription })
      setEditingId(null)
      setEditingDescription('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingDescription('')
  }

  const handleToggleDone = (task: Task) => {
    // Derive the next value from the overlay, so a quick double click sends on, then off.
    toggleTask({ id: task.id, done: !overlayDone(toggles.get(task.id), tasksData, task) })
  }

  const handleDelete = (id: number) => {
    if (confirm('Delete this task?')) {
      deleteTask({ id })
    }
  }

  const list = listsData.data?.find((l) => l.id === listId)
  // A task whose delete succeeded hides until the refetched data drops it.
  const tasks = (tasksData.data || []).filter((task) => deletes.get(task.id)?.isSuccess !== true)

  if (listsData.isLoading || tasksData.isLoading) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  if (!list) {
    return (
      <div style={{ padding: '20px' }}>
        <p>List not found</p>
        <button onClick={() => goToLists({})}>Back to Lists</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => goToLists({})} style={{ marginBottom: '10px' }}>
        ← Back to Lists
      </button>

      <h1>{list.name}</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
          placeholder="New task description"
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button type="submit" disabled={creating} style={{ padding: '8px 16px' }}>
          Add Task
        </button>
      </form>

      {tasks.length === 0 ? (
        <p>No tasks yet. Add one above!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map((task) => {
            const done = overlayDone(toggles.get(task.id), tasksData, task)
            return (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  padding: '10px',
                  border: '1px solid #ccc',
                }}
              >
                {editingId === task.id ? (
                  <>
                    <input
                      type="text"
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      style={{ padding: '4px', flex: 1 }}
                    />
                    <button
                      onClick={() => handleUpdate(task)}
                      disabled={updates.get(task.id)?.isPending === true}
                      style={{ padding: '4px 12px' }}
                    >
                      Save
                    </button>
                    <button onClick={handleCancelEdit} style={{ padding: '4px 12px' }}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <input type="checkbox" checked={done} onChange={() => handleToggleDone(task)} />
                    <span
                      style={{
                        flex: 1,
                        textDecoration: done ? 'line-through' : 'none',
                        opacity: done ? 0.6 : 1,
                      }}
                    >
                      {task.description}
                    </span>
                    {toggleFailed(toggles.get(task.id)) && (
                      <span role="alert" style={{ color: 'red' }}>
                        Couldn't save{' '}
                        <button aria-label="Dismiss" onClick={() => dismissToggle(task.id)}>
                          ✕
                        </button>
                      </span>
                    )}
                    <button onClick={() => handleEdit(task)} style={{ padding: '4px 12px' }}>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={deletes.get(task.id)?.isPending === true}
                      style={{ padding: '4px 12px' }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
