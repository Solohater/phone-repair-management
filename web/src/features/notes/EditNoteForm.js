import { useState, useEffect } from "react"
import { useUpdateNoteMutation, useDeleteNoteMutation } from "./notesApiSlice"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faTrashCan, faComment, faSpinner } from "@fortawesome/free-solid-svg-icons"
import useAuth from "../../hooks/useAuth"

const EditNoteForm = ({ note, users }) => {

    const {isManager, isAdmin} = useAuth()

    const [updateNote, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useUpdateNoteMutation()

    const [deleteNote, {
        isSuccess: isDelSuccess,
        isError: isDelError,
        error: delerror
    }] = useDeleteNoteMutation()

    const navigate = useNavigate()

    const canEditFull = isAdmin || isManager

    const [title, setTitle] = useState(note.title)
    const [text, setText] = useState(note.text)
    const [status, setStatus] = useState(note.status || 'pending')
    const [userId, setUserId] = useState(note.user)
    const [comment, setComment] = useState(note.comment || '')

    useEffect(() => {

        if (isSuccess || isDelSuccess) {
            setTitle('')
            setText('')
            setUserId('')
            setComment('')
            navigate('/dash/notes')
        }

    }, [isSuccess, isDelSuccess, navigate])

    const onTitleChanged = e => setTitle(e.target.value)
    const onTextChanged = e => setText(e.target.value)
    const onStatusChanged = e => setStatus(e.target.value)
    const onUserIdChanged = e => setUserId(e.target.value)
    const onCommentChanged = e => setComment(e.target.value)

    const canSaveFull = [title, text, userId, status].every(Boolean) && !isLoading
    const canSaveComment = comment !== note.comment && !isLoading

    const onSaveNoteClicked = async (e) => {
        if (canEditFull && canSaveFull) {
            await updateNote({ id: note.id, user: userId, title, text, status, comment })
        } else if (!canEditFull && canSaveComment) {
            await updateNote({ id: note.id, comment })
        }
    }

    const onDeleteNoteClicked = async () => {
        await deleteNote({ id: note.id })
    }

    const created = new Date(note.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    const updated = new Date(note.updatedAt).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })

    const userOptions = users.map(user => {
        return (
            <option
                key={user.id}
                value={user.id}
            > {user.username}</option >
        )
    })

    const statusOptions = [
        { value: 'new', label: 'New' },
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'blocked', label: 'Blocked' },
        { value: 'completed', label: 'Completed' },
        { value: 'needs_rework', label: 'Needs Rework' },
    ]

    const errClass = (isError || isDelError) ? "errmsg" : "offscreen"
    const validTitleClass = !title ? "form__input--incomplete" : ''
    const validTextClass = !text ? "form__input--incomplete" : ''

    const errContent = (error?.data?.message || delerror?.data?.message) ?? ''

    let deleteButton = null
    if (isAdmin) {
        deleteButton = (
          <button
            className="icon-button"
            title='Delete'
            onClick={onDeleteNoteClicked}
            >
                <FontAwesomeIcon icon={faTrashCan}/>
            </button>
        )
    }

    if (canEditFull) {
        const content = (
            <>
                <p className={errClass}>{errContent}</p>

                <form className="form" onSubmit={e => e.preventDefault()}>
                    <div className="form__title-row">
                        <h2>Edit Task #{note.ticket}</h2>
                        <div className="form__action-buttons">
                            <button
                                className="form__submit-button"
                                title="Save"
                                onClick={onSaveNoteClicked}
                                disabled={!canSaveFull || isLoading}
                            >
                                {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
                                Save Task
                            </button>
                            {deleteButton}
                        </div>
                    </div>
                    <label className="form__label" htmlFor="note-title">
                        Title:</label>
                    <input
                        className={`form__input ${validTitleClass}`}
                        id="note-title"
                        name="title"
                        type="text"
                        autoComplete="off"
                        value={title}
                        onChange={onTitleChanged}
                    />

                    <label className="form__label" htmlFor="note-text">
                        Description:</label>
                    <textarea
                        className={`form__input form__input--text ${validTextClass}`}
                        id="note-text"
                        name="text"
                        value={text}
                        onChange={onTextChanged}
                    />

                    <label className="form__label" htmlFor="note-comment">
                        Employee Comment:</label>
                    <textarea
                        className="form__input form__input--text"
                        id="note-comment"
                        name="comment"
                        value={comment}
                        onChange={onCommentChanged}
                        placeholder="Comment from employee about progress, blockages, or extra work..."
                    />

                    <div className="form__row">
                        <div className="form__divider">
                            <label className="form__label" htmlFor="note-status">
                                Status:</label>
                            <select
                                id="note-status"
                                name="status"
                                className="form__select"
                                value={status}
                                onChange={onStatusChanged}
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>

                            <label className="form__label" htmlFor="note-username">
                                Assigned To:</label>
                            <select
                                id="note-username"
                                name="username"
                                className="form__select"
                                value={userId}
                                onChange={onUserIdChanged}
                            >
                                {userOptions}
                            </select>
                        </div>
                        <div className="form__divider">
                            <p className="form__created">Created:<br />{created}</p>
                            <p className="form__updated">Updated:<br />{updated}</p>
                        </div>
                    </div>
                </form>
            </>
        )
        return content
    }

    const content = (
        <>
            <p className={errClass}>{errContent}</p>

            <form className="form" onSubmit={e => e.preventDefault()}>
                <div className="form__title-row">
                    <h2>Task #{note.ticket}</h2>
                    <div className="form__action-buttons">
                        <button
                            className="form__submit-button"
                            title="Save Comment"
                            onClick={onSaveNoteClicked}
                            disabled={!canSaveComment || isLoading}
                        >
                            {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faComment} />}
                            Save Comment
                        </button>
                    </div>
                </div>

                <label className="form__label">Title:</label>
                <p className="form__readonly">{note.title}</p>

                <label className="form__label">Description:</label>
                <p className="form__readonly">{note.text}</p>

                <label className="form__label" htmlFor="note-comment">
                    Your Comment:</label>
                <textarea
                    className={`form__input form__input--text`}
                    id="note-comment"
                    name="comment"
                    value={comment}
                    onChange={onCommentChanged}
                    placeholder="Add a comment about progress, blockages, or extra work performed..."
                />

                <div className="form__row">
                    <div className="form__divider">
                        <label className="form__label">Status:</label>
                        <p className="form__readonly form__readonly--badge">
                            <span className={`status-badge status-badge--${note.status}`}>
                                {statusOptions.find(o => o.value === note.status)?.label || note.status}
                            </span>
                        </p>
                        <label className="form__label">Assigned To:</label>
                        <p className="form__readonly">{users.find(u => u.id === note.user)?.username || ''}</p>
                    </div>
                    <div className="form__divider">
                        <p className="form__created">Created:<br />{created}</p>
                        <p className="form__updated">Updated:<br />{updated}</p>
                    </div>
                </div>
            </form>
        </>
    )

    return content
}

export default EditNoteForm