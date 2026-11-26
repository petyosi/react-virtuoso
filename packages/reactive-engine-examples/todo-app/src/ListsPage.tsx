import { useState } from 'react'

import { useCell, useCellValue, usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { createListMutation, deleteListMutation, editingId$, newListName$, updateListMutation } from './mutations'
import { listsQuery } from './queries'
import { tasks$ } from './routes'

import type { List } from './types'

export function ListsPage() {
  const listsData = useCellValue(listsQuery.data$)
  const createList = usePublisher(createListMutation.mutate$)
  const createResult = useCellValue(createListMutation.data$)
  const updateList = usePublisher(updateListMutation.mutate$)
  const updates = useCellValue(updateListMutation.status$)
  const dismissUpdate = usePublisher(updateListMutation.dismiss$)
  const deleteList = usePublisher(deleteListMutation.mutate$)
  const deletes = useCellValue(deleteListMutation.status$)
  const dismissDelete = usePublisher(deleteListMutation.dismiss$)
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
    const update = updates.get(list.id)
    setEditingName(update?.isSuccess === true ? update.params.name : list.name)
  }

  const handleUpdate = (id: string) => {
    if (editingName.trim()) {
      // The editor closes when the save succeeds, in updateListMutation's onSuccess.
      updateList({ id, name: editingName })
    }
  }

  const handleCancelEdit = (id: string) => {
    setEditingId(null)
    // Clears a failed save. A save that is still running continues; cancel does not recall it.
    dismissUpdate(id)
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
        <button type="submit" disabled={createResult.isPending} style={{ padding: '8px 16px' }}>
          Create List
        </button>
        {createResult.isError && (
          <span role="alert" style={{ color: 'red', marginLeft: '10px' }}>
            Couldn't create the list
          </span>
        )}
      </form>

      {lists.length === 0 ? (
        <p>No lists yet. Create one above!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lists.map((list) => {
            const update = updates.get(list.id)
            const deletion = deletes.get(list.id)
            // A saved name shows until the refetched data has it.
            const name = update?.isSuccess === true ? update.params.name : list.name
            return (
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
                    <button onClick={() => handleUpdate(list.id)} disabled={update?.isPending === true} style={{ padding: '4px 12px' }}>
                      {update?.isPending === true ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => handleCancelEdit(list.id)} style={{ padding: '4px 12px' }}>
                      Cancel
                    </button>
                    {update?.isError === true && (
                      <span role="alert" style={{ color: 'red' }}>
                        Couldn't save
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1 }}>{name}</span>
                    <button onClick={() => handleViewTasks(list.id)} style={{ padding: '4px 12px' }}>
                      View Tasks
                    </button>
                    <button onClick={() => handleEdit(list)} style={{ padding: '4px 12px' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(list.id)} disabled={deletion?.isPending === true} style={{ padding: '4px 12px' }}>
                      Delete
                    </button>
                    {deletion?.isError === true && (
                      <span role="alert" style={{ color: 'red' }}>
                        Couldn't delete{' '}
                        <button aria-label="Dismiss" onClick={() => dismissDelete(list.id)}>
                          ✕
                        </button>
                      </span>
                    )}
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
