import FollowingTokens from '../components/tokens/FollowingTokens'
import styles from './pages.module.css'
export default function TrackedTokens() {

    return (
        <div id="tracked_tokens" className={`tracked_tokens content-box ${styles.displayNone}`}>
            <h3>Tokens you're following</h3>
            <FollowingTokens></FollowingTokens>
        </div>
    )
}