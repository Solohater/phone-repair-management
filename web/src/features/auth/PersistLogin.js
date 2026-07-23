import { Outlet, Link } from "react-router-dom"
import { useEffect, useRef, useState } from 'react'
import { useRefreshMutation } from "./authApiSlice"
import usePersist from "../../hooks/usePersist"
import { useSelector } from 'react-redux'
import { selectCurrentToken } from "./authSlice"
import PulseLoader from 'react-spinners/PulseLoader'

const PersistLogin = () => {

    const [persist] = usePersist()
    const token = useSelector(selectCurrentToken)
    const effectRan = useRef(false)

    const [trueSuccess, setTrueSuccess] = useState(false)

    const [refresh, {
        isUninitialized,
        isLoading,
        isSuccess,
        isError,
        error
    }] = useRefreshMutation()


    useEffect(() => {

        if (effectRan.current === true || process.env.NODE_ENV !== 'development') { // React 18 Strict Mode

            const verifyRefreshToken = async () => {
                console.log('verifying refresh token')
                try {
                    await refresh()
                    setTrueSuccess(true)
                }
                catch (err) {
                    console.error(err)
                }
            }

            if (!token) verifyRefreshToken()
        }

        return () => effectRan.current = true

        // eslint-disable-next-line
    }, [])


    let content
    if (isLoading) {
        content = <PulseLoader color={"var(--accent)"} />
    } else if (isError) {
        if (persist) {
            content = (
                <p className='errmsg'>
                    {`${error?.data?.message} - `}
                    <Link to="/login">Please login again</Link>.
                </p>
            )
        } else {
            content = <Outlet />
        }
    } else if (isSuccess && trueSuccess) {
        content = <Outlet />
    } else if (token) {
        content = <Outlet />
    } else if (isUninitialized) {
        content = <PulseLoader color={"var(--accent)"} />
    } else {
        content = <PulseLoader color={"var(--accent)"} />
    }

    return content
}
export default PersistLogin