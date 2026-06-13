import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          Service<span>CI</span>
        </Link>

        <div className={styles.links}>
          {user ? (
            <>
              <Link
                to="/post-service"
                className="btn btn-outline"
                style={{ fontSize: 13, padding: '8px 16px' }}
              >
                + Publier une annonce
              </Link>
              <div className={styles.userMenu}>
                <div
                  className={`avatar avatar-sm avatar-placeholder ${styles.avatarBtn}`}
                  onClick={() => navigate('/profile')}
                  title={profile?.full_name}
                >
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="avatar avatar-sm" />
                    : getInitials(profile?.full_name || user.email)
                  }
                </div>
                <div className={styles.dropdown}>
                  <Link to="/profile" className={styles.dropItem}>Mon profil</Link>
                  <Link to="/my-services" className={styles.dropItem}>Mes annonces</Link>
                  <div className={styles.dropDivider} />
                  <button onClick={handleSignOut} className={styles.dropItem}>
                    Déconnexion
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-outline"
                style={{ fontSize: 13, padding: '8px 16px' }}
              >
                Se connecter
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '8px 16px' }}
              >
                Publier une annonce
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}