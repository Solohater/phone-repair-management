import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'

const statusLabels = {
  new: 'New',
  pending: 'Pending',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
  needs_rework: 'Needs Rework',
}

const TaskColumn = ({ status, notes }) => {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div className={`task-column task-column--${status}`}>
      <div className="task-column__header">
        <span>{statusLabels[status] || status}</span>
        <span className="task-column__count">{notes.length}</span>
      </div>
      <div ref={setNodeRef} className="task-column__cards">
        <SortableContext items={notes.map(n => n.id)} strategy={verticalListSortingStrategy}>
          {notes.map(note => (
            <TaskCard key={note.id} note={note} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export default TaskColumn