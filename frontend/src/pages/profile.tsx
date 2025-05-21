import styles from './pages.module.css'
export default function Profile() {

    return (
        <div id="profile" className={`profile content-box ${styles.displayNone}`}>
            <h3>Your Profile</h3>
            <p>Manage your personal information and account settings here.</p>
        </div>
    )
}