import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Navbar.module.css'

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 52 52" aria-hidden="true">
      <rect width="52" height="52" rx="13" fill="#085041"/>
      <circle cx="19" cy="26" r="7" fill="#1D9E75"/>
      <circle cx="33" cy="26" r="7" fill="#1D9E75"/>
      <circle cx="26" cy="15" r="5" fill="#9FE1CB"/>
      <circle cx="26" cy="37" r="5" fill="#9FE1CB"/>
      <line x1="19" y1="26" x2="33" y2="26" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round"/>
      <line x1="19" y1="26" x2="26" y2="15" stroke="#9FE1CB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="33" y1="26" x2="26" y2="15" stroke="#9FE1CB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19" y1="26" x2="26" y2="37" stroke="#9FE1CB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="33" y1="26" x2="26" y2="37" stroke="#9FE1CB" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function Navbar() {
  var { user, profile, signOut } = useAuth()
  var navigate = useNavigate()
  var [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(function(n) { return n[0] }).join('').toUpperCase().slice(0, 2)
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  var displayName = (profile && profile.full_name) ? profile.full_name : (user ? user.email : '')
  var hasAvatar   = profile && profile.avatar_url

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>

        {/* ── Logo ── */}
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          <LogoMark />
          <span className={styles.logoText}>
            Connect<span className={styles.logoAccent}>-CI</span>
          </span>
        </Link>

        {/* ── Desktop links ── */}
        <div className={styles.desktopLinks}>
          {user ? (
            <>
              <Link
                to="/post-service"
                className={'btn btn-outline ' + styles.publishBtn}
              >
                + Publier une annonce
              </Link>
              <div className={styles.userMenu}>
                <button
                  className={styles.avatarBtn}
                  onClick={function() { setMenuOpen(!menuOpen) }}
                  aria-label="Menu compte"
                  aria-expanded={menuOpen}
                >
                  {hasAvatar
                    ? <img src={profile.avatar_url} alt="" className={styles.avatarImg} />
                    : <span className={styles.avatarInitials}>{getInitials(displayName)}</span>
                  }
                </button>

                {menuOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropHeader}>
                      <div className={styles.dropName}>{displayName}</div>
                      <div className={styles.dropEmail}>{user.email}</div>
                    </div>
                    <div className={styles.dropDivider} />
                    <Link to="/profile"      className={styles.dropItem} onClick={closeMenu}>
                      <span className={styles.dropIcon}>👤</span> Mon profil
                    </Link>
                    <Link to="/profile" className={styles.dropItem} onClick={closeMenu}>
                      <span className={styles.dropIcon}>📋</span> Mes annonces
                    </Link>
                    <Link to="/post-service" className={styles.dropItem} onClick={closeMenu}>
                      <span className={styles.dropIcon}>➕</span> Nouvelle annonce
                    </Link>
                    <div className={styles.dropDivider} />
                    <button className={styles.dropItem + ' ' + styles.dropLogout} onClick={handleSignOut}>
                      <span className={styles.dropIcon}>🚪</span> Deconnexion
                    </button>
                  </div>
                )}

                {/* Backdrop to close menu */}
                {menuOpen && (
                  <div className={styles.backdrop} onClick={closeMenu} />
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={'btn btn-outline ' + styles.loginBtn}>
                Se connecter
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Publier une annonce
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile right side ── */}
        <div className={styles.mobileRight}>
          {user ? (
            <button
              className={styles.avatarBtn}
              onClick={function() { navigate('/profile') }}
              aria-label="Mon profil"
            >
              {hasAvatar
                ? <img src={profile.avatar_url} alt="" className={styles.avatarImg} />
                : <span className={styles.avatarInitials}>{getInitials(displayName)}</span>
              }
            </button>
          ) : (
            <Link to="/signup" className={'btn btn-primary ' + styles.mobilePublishBtn}>
              Publier
            </Link>
          )}
        </div>

      </div>
    </nav>
  )
}