import { useState } from 'react'

import { useCell, useCellValue, usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { createListMutation, deleteListMutation, editingId$, newListName$, updateListMutation } from './mutations'
import { listsQuery } from './queries'
import { tasks$ } from './routes'

import type { List } from './types'

export function ListsPage() {
  const listsData = useCellValue(listsQuery.data$)
  const createList = usePublisher(createListMutation.mutate$)
  const creating = useCellValue(createListMutation.data$).isPending
  const updateList = usePublisher(updateListMutation.mutate$)
  const updates = useCellValue(updateListMutation.status$)
  const deleteList = usePublisher(deleteListMutation.mutate$)
  const deletes = useCellValue(deleteListMutation.status$)
  const goToTasks = usePublisher(tasks$)

  const [newListName, setNewListName] = useCell(newListName$)
  const [editingId, setEditingId] = useCell(editingId$)
  const [editingName, setEditingName] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newListName.trim()) {
      // The input clears when the list is created, in createListMutation's onSuccess.
      createList({ name: newListName })
    }
  }

  const handleEdit = (list: List) => {
    setEditingId(list.id)
    setEditingName(list.name)
  }

  const handleUpdate = (id: string) => {
    if (editingName.trim()) {
      updateList({ id, name: editingName })
      setEditingId(null)
      setEditingName('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this list?')) {
      deleteList({ id })
    }
  }

  const handleViewTasks = (id: string) => {
    goToTasks({ id })
  }

  if (listsData.isLoading) {
    return <div style={{ padding: '20px' }}>Loading lists...</div>
  }

  if (listsData.isError) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {String(listsData.error)}</div>
  }

  // A list whose delete succeeded hides until the refetched data drops it.
  const lists = (listsData.data || []).filter((list) => deletes.get(list.id)?.isSuccess !== true)

  return (
    <div style={{ padding: '20px' }}>
      <h1>Todo Lists</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name"
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button type="submit" disabled={creating} style={{ padding: '8px 16px' }}>
          Create List
        </button>
      </form>

      {lists.length === 0 ? (
        <p>No lists yet. Create one above!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lists.map((list) => (
            <div
              key={list.id}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                padding: '10px',
                border: '1px solid #ccc',
              }}
            >
              {editingId === list.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    style={{ padding: '4px', flex: 1 }}
                  />
                  <button
                    onClick={() => handleUpdate(list.id)}
                    disabled={updates.get(list.id)?.isPending === true}
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
                  <span style={{ flex: 1 }}>{list.name}</span>
                  <button onClick={() => handleViewTasks(list.id)} style={{ padding: '4px 12px' }}>
                    View Tasks
                  </button>
                  <button onClick={() => handleEdit(list)} style={{ padding: '4px 12px' }}>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(list.id)}
                    disabled={deletes.get(list.id)?.isPending === true}
                    style={{ padding: '4px 12px' }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
