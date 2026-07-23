import { useGetNotesQuery } from "./notesApiSlice"
import TaskBoard from "../../components/TaskBoard"
import useAuth from "../../hooks/useAuth"
import useTitle from "../../hooks/useTitle"
import PulseLoader from 'react-spinners/PulseLoader'

const NotesList = () => {
    useTitle('Repair Shop: Tasks')

    const { username, isManager, isAdmin } = useAuth()

    const {
        data: notes,
        isLoading,
        isSuccess,
        isError,
        error
    } = useGetNotesQuery('notesList', {
        pollingInterval: 10000,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true
    })

    let content

    if (isLoading) content = <PulseLoader color={"var(--accent)"} />

    if (isError) {
        content = <p className="errmsg">{error?.data?.message}</p>
    }

    if (isSuccess) {
        const { entities } = notes
        const notesArray = Object.values(entities)

        content = (
            <TaskBoard
                notes={notesArray}
                username={username}
                isManager={isManager}
                isAdmin={isAdmin}
            />
        )
    }

    return content
}
export default NotesList
