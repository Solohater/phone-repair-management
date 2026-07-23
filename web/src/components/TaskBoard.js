import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import TaskColumn from './TaskColumn'
import TaskCard from './TaskCard'
import { useUpdateNoteMutation } from '../features/notes/notesApiSlice'

const statuses = ['new', 'pending', 'in_progress', 'blocked', 'completed', 'needs_rework']

const TaskBoard = ({ notes, username, isManager, isAdmin }) => {
  const [updateNote] = useUpdateNoteMutation()
  const [activeNote, setActiveNote] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const canDragNote = useCallback((note) => {
    if (isAdmin || isManager) return true
    return note.username === username
  }, [isAdmin, isManager, username])

  const columns = statuses.reduce((acc, status) => {
    acc[status] = notes.filter(n => n.status === status)
    return acc
  }, {})

  const handleDragStart = useCallback((event) => {
    const { active } = event
    const note = notes.find(n => n.id === active.id)
    if (note && canDragNote(note)) setActiveNote(note)
  }, [notes, canDragNote])

  const handleDragEnd = useCallback(async (event) => {
    setActiveNote(null)
    const { active, over } = event
    if (!over) return

    const noteId = active.id
    const note = notes.find(n => n.id === noteId)
    if (!note || !canDragNote(note)) return

    let newStatus = over.id

    if (!statuses.includes(newStatus)) {
      const overNote = notes.find(n => n.id === over.id)
      if (overNote) {
        newStatus = overNote.status
      }
    }

    if (!statuses.includes(newStatus)) return
    if (note.status === newStatus) return

    try {
      if (isAdmin || isManager) {
        await updateNote({
          id: noteId,
          user: note.user,
          title: note.title,
          text: note.text,
          status: newStatus,
        })
      } else {
        await updateNote({ id: noteId, status: newStatus })
      }
    } catch (err) {
      console.error('Failed to update note status:', err)
    }
  }, [notes, updateNote, canDragNote, isAdmin, isManager])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="task-board">
        {statuses.map(status => (
          <TaskColumn key={status} status={status} notes={columns[status]} />
        ))}
      </div>
      <DragOverlay>
        {activeNote ? <TaskCard note={activeNote} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

export default TaskBoard