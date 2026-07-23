import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
    faRightFromBracket,
    faFilePen,
    faUserGear,
    faUserPlus,
    faFileCirclePlus,
    faSun,
    faMoon
} from "@fortawesome/free-solid-svg-icons"
import { useNavigate, Link, useLocation } from 'react-router-dom'

import { useSendLogoutMutation } from '../features/auth/authApiSlice'
import useAuth from '../hooks/useAuth'
import useTheme from '../hooks/useTheme'

const NOTES_REGEX = /^\/dash\/notes(\/)?$/
const USERS_REGEX = /^\/dash\/users(\/)?$/

const DashHeader = () => {

    const { isAdmin, isManager } = useAuth()
    const { theme, toggleTheme } = useTheme()

    const navigate = useNavigate()
    const { pathname } = useLocation()

    const [sendLogout, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useSendLogoutMutation()

    useEffect(() => {
        if (isSuccess) navigate('/')
    }, [isSuccess, navigate])

    const onNewNoteClicked = () => navigate('/dash/notes/new')
    const onNewUserClicked = () => navigate('/dash/users/new')
    const onNotesClicked = () => navigate('/dash/notes')
    const onUsersClicked = () => navigate('/dash/users')

    let newNoteButton = null
    if (NOTES_REGEX.test(pathname) && (isAdmin || isManager)) {
        newNoteButton = (
            <button
                className="icon-button"
                title="New Task"
                onClick={onNewNoteClicked}
            >
                <FontAwesomeIcon icon={faFileCirclePlus} />
            </button>
        )
    }

    let newUserButton = null
    if (USERS_REGEX.test(pathname)) {
        newUserButton = (
            <button
                className="icon-button"
                title="New User"
                onClick={onNewUserClicked}
            >
                <FontAwesomeIcon icon={faUserPlus} />
            </button>
        )
    }

    let userButton = null
    if (isAdmin) {
        if (!USERS_REGEX.test(pathname) && pathname.includes('/dash')) {
            userButton = (
                <button
                    className="icon-button"
                    title="Users"
                    onClick={onUsersClicked}
                >
                    <FontAwesomeIcon icon={faUserGear} />
                </button>
            )
        }
    }

    let notesButton = null
    if (!NOTES_REGEX.test(pathname) && pathname.includes('/dash')) {
        notesButton = (
            <button
                className="icon-button"
                title="Tasks"
                onClick={onNotesClicked}
            >
                <FontAwesomeIcon icon={faFilePen} />
            </button>
        )
    }

    const onLogoutClicked = () => {
        sendLogout()
    }

    const logoutButton = (
        <button
            className="icon-button"
            title="Logout"
            onClick={onLogoutClicked}
        >
            <FontAwesomeIcon icon={faRightFromBracket} />
        </button>
    )

    const errClass = isError ? "errmsg" : "offscreen"

    let buttonContent
    if (isLoading) {
        buttonContent = <p>Logging Out...</p>
    } else {
        buttonContent = (
            <>
                {newNoteButton}
                {newUserButton}
                {notesButton}
                {userButton}
                {logoutButton}
            </>
        )
    }

    const content = (
    <>
        <p className={errClass}>{error?.data?.message}</p>

        <header className="dash-header">
            <div className="dash-header__container">
                <Link to="/dash">
                    <h1 className="dash-header__title">Repair Shop</h1>
                </Link>
                <nav className="dash-header__nav">
                    <button
                        className="theme-toggle"
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        onClick={toggleTheme}
                    >
                        <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
                    </button>
                    {buttonContent}
                </nav>
            </div>
        </header> 
    </>
)

return content
}
export default DashHeader
