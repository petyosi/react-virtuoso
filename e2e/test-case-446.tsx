import * as React from 'react'
import { useState } from 'react'
import { Virtuoso } from '../src'

const itemContent = (index: number, note: { content: string }) => (
  <div style={{ height: index % 2 ? 70.3 : 30.6, background: 'white' }}>{note.content}</div>
)
// globalThis['VIRTUOSO_LOG_LEVEL'] = 0

const notes: Array<ReturnType<typeof note>> = []
function note(index: number) {
  return {
    index: index + 1,
    content: `Note ${index}`,
  }
}

export const getNote = (index: number) => {
  if (!notes[index]) {
    notes[index] = note(index)
  }

  return notes[index]
}

const generateNotes = (length: number, startIndex = 0) => {
  return Array.from({ length }).map((_, i) => getNote(i + startIndex))
}

const START_INDEX = 10000
const INITIAL_ITEM_COUNT = 20

export default function App() {
  const [topMostItemIndex, setTopMostItemIndex] = useState(10)
  const [notes] = useState(() => generateNotes(INITIAL_ITEM_COUNT, START_INDEX))

  return (
    <div>
      <button onClick={() => setTopMostItemIndex(() => 3)}>Topmost index = 3</button>
      <button onClick={() => setTopMostItemIndex(() => 7)}>Topmost index = 7</button>
      <Virtuoso data={notes} itemContent={itemContent} initialTopMostItemIndex={topMostItemIndex} style={{ height: 300 }} />
    </div>
  )
}
