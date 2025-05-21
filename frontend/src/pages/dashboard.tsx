import styles from './pages.module.css'
export default function Dashboard() {
    return (
        <div id="dashboard" className={`dashboard content-box ${styles.active}`}>
            <h3>Welcome to the Dashboard</h3>
            <p>This is your main dashboard where you can see important data and analytics.</p>
        </div>
    )
}