import { Link } from 'react-router-dom'
import { useGetNotesQuery } from '../notes/notesApiSlice'
import useAuth from '../../hooks/useAuth'
import useTitle from '../../hooks/useTitle'

const Welcome = () => {
    
    const { username, isManager, isAdmin } = useAuth()

    useTitle(`Repair Shop: ${username}`)

    const date = new Date()
    const today = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'long' }).format(date)

    const {
        data: notes,
        isSuccess,
    } = useGetNotesQuery('notesList', {
        pollingInterval: 15000,
        refetchOnFocus: true,
    })

    let stats = null
    if (isSuccess) {
        const { entities } = notes
        const allNotes = Object.values(entities)
        const userNotes = allNotes

        const counts = {
            pending: userNotes.filter(n => n.status === 'pending').length,
            in_progress: userNotes.filter(n => n.status === 'in_progress').length,
            blocked: userNotes.filter(n => n.status === 'blocked').length,
            completed: userNotes.filter(n => n.status === 'completed').length,
            needs_rework: userNotes.filter(n => n.status === 'needs_rework').length,
        }

        stats = (
            <div className="welcome__stats">
                <div className="stat-card">
                    <div className="stat-card__label">Pending</div>
                    <div className="stat-card__value" style={{ color: 'var(--warning)' }}>{counts.pending}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__label">In Progress</div>
                    <div className="stat-card__value" style={{ color: 'var(--purple)' }}>{counts.in_progress}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__label">Blocked</div>
                    <div className="stat-card__value" style={{ color: 'var(--danger)' }}>{counts.blocked}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__label">Completed</div>
                    <div className="stat-card__value" style={{ color: 'var(--success)' }}>{counts.completed}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__label">Needs Rework</div>
                    <div className="stat-card__value" style={{ color: 'var(--warning)' }}>{counts.needs_rework}</div>
                </div>
            </div>
        )
    }

    const content = (
        <section className="welcome">

            <p>{today}</p>

            <h1>Welcome back, {username}!</h1>

            {stats}

            <div className="welcome__links">
                <p><Link to="/dash/notes">View Task Board</Link></p>
                {(isAdmin || isManager) && <p><Link to="/dash/notes/new">Add New Task</Link></p>}

                {isAdmin && <p><Link to="/dash/users">Manage Users</Link></p>}
                {isAdmin && <p><Link to="/dash/users/new">Add New User</Link></p>}
            </div>

        </section>
    )

    return content
}
export default Welcome
