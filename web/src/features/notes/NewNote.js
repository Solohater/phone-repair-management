import NewNoteForm from './NewNoteForm'
import { useGetUsersQuery } from '../users/usersApiSlice'
import PulseLoader from 'react-spinners/PulseLoader'
import useTitle from '../../hooks/useTitle'
import useAuth from '../../hooks/useAuth'

const NewNote = () => {
    useTitle('Repair Shop: New Task')

    const { isAdmin, isManager } = useAuth()

    const { users } = useGetUsersQuery("usersList", {
        selectFromResult: ({ data }) => ({
            users: data?.ids.map(id => data?.entities[id])
        }),
    })

    if (!isAdmin && !isManager) {
        return <p className="errmsg">No access</p>
    }

    if (!users?.length) return <PulseLoader color={"var(--accent)"} />

    const content = <NewNoteForm users={users} />

    return content
}
export default NewNote 