import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const TaskCard = ({ note }) => {
  const navigate = useNavigate()
  const { isAdmin, isManager, username } = useAuth()

  const canDrag = isAdmin || isManager || (note && note.username === username)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note?.id || 'placeholder',
    data: { type: 'note', note },
    disabled: !canDrag || !note,
  })

  if (!note || !note.id) return null

  const created = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : ''

  const canEdit = isAdmin || isManager || note.username === username

  const style = canDrag
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  const dragProps = canDrag ? { ref: setNodeRef, style, ...attributes, ...listeners } : {}

  return (
    <div className="task-card" {...dragProps}>
      <div className="task-card__title">{note.title || ''}</div>
      <div className="task-card__meta">
        <span className="task-card__user">{note.username || ''}</span>
        <span>{created}</span>
      </div>
      {note.comment && (
        <div className="task-card__comment">
          <span className="task-card__comment-label">Comment:</span>
          <span>{note.comment}</span>
        </div>
      )}
      {canEdit && (
        <div className="task-card__actions">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/dash/notes/${note.id}`)
            }}
            title="Edit"
          >
            <FontAwesomeIcon icon={faPenToSquare} /> Edit
          </button>
        </div>
      )}
    </div>
  )
}

export default TaskCard