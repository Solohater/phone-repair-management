import { Link } from "react-router-dom";

const Public = () => {
    const content = (
        <section className="public">
            <header>
                <h1>Welcome to <span className="nowrap">Repair Shop Manager</span></h1>
            </header>
            <main className="public__main">
                <p>Manage your repair shop employees and their daily tasks efficiently.</p>
                <p>Track task status from pending to completion, assign work to employees, and monitor progress in real-time.</p>
            </main>
            <footer>
                <Link to="/login">Login</Link>
            </footer>
        </section>

    )
    return content
}

export default Public
