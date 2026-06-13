import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import styles from './Profile.module.css'

export default function Profile() {
  var { user, profile, signOut, updateProfile } = useAuth()
  var navigate = useNavigate()

  var [tab, setTab] = useState('annonces')

  // My listings state
  var [annonces, setAnnonces] = useState([])
  var [annoncesLoading, setAnnoncesLoading] = useState(true)

  // Settings form state
  var [form, setForm] = useState({
    full_name: '',
    phone: '',
    whatsapp: '',
    city: '',
    bio: '',
  })
  var [saving, setSaving] = useState(false)
  var [saveSuccess, setSaveSuccess] = useState(false)
  var [saveError, setSaveError] = useState('')

  // Redirect if not logged in
  if (!user) {
    navigate('/login')
    return null
  }

  // Populate settings form when profile loads
  useEffect(function() {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone:     profile.phone     || '',
        whatsapp:  profile.whatsapp  || '',
        city:      profile.city      || '',
        bio:       profile.bio       || '',
      })
    }
  }, [profile])

  // Fetch provider's own listings
  useEffect(function() {
    if (!user) return
    setAnnoncesLoading(true)
    supabase
      .from('services')
      .select('id, title, category, city, price, price_unit, is_active, created_at')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
      .then(function(res) {
        if (res.data) setAnnonces(res.data)
        setAnnoncesLoading(false)
      })
  }, [user])

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(function(n) { return n[0] }).join('').toUpperCase().slice(0, 2)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function setField(field, value) {
    setForm(function(prev) {
      var next = Object.assign({}, prev)
      next[field] = value
      return next
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    setSaveError('')
    try {
      await updateProfile({
        full_name: form.full_name.trim(),
        phone:     form.phone.trim(),
        whatsapp:  form.whatsapp.trim() || null,
        city:      form.city.trim(),
        bio:       form.bio.trim(),
      })
      setSaveSuccess(true)
      setTimeout(function() { setSaveSuccess(false) }, 3000)
    } catch (err) {
      setSaveError('Erreur lors de la sauvegarde : ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  var displayName = (profile && profile.full_name) ? profile.full_name : user.email
  var displayCity = (profile && profile.city) ? profile.city : "Cote d'Ivoire"
  var isVerified  = profile && profile.is_verified

  return (
    <div className="container" style={{ padding: '24px 16px 60px' }}>

      {/* ── Profile header ── */}
      <div className={styles.profileHeader}>
        <div className={'avatar avatar-lg avatar-placeholder ' + styles.avatar}>
          {profile && profile.avatar_url
            ? <img src={profile.avatar_url} alt="" className="avatar avatar-lg" />
            : getInitials(displayName)
          }
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{displayName}</h1>
          <p className={styles.profileMeta}>
            {user.email}
            <span style={{ margin: '0 6px' }}>·</span>
            {displayCity}
            {isVerified && <span className={styles.verified}> ✓ Verifie</span>}
          </p>
          <div className={styles.regBadge}>
            Prestataire inscrit
          </div>
        </div>
        <button
          className="btn btn-outline"
          onClick={handleSignOut}
          style={{ fontSize: 13, flexShrink: 0 }}
        >
          Deconnexion
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        <button
          className={styles.tab + (tab === 'annonces' ? ' ' + styles.activeTab : '')}
          onClick={function() { setTab('annonces') }}
        >
          Mes annonces
        </button>
        <button
          className={styles.tab + (tab === 'parametres' ? ' ' + styles.activeTab : '')}
          onClick={function() { setTab('parametres') }}
        >
          Parametres
        </button>
      </div>

      {/* ── Tab: Mes annonces ── */}
      {tab === 'annonces' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#888' }}>
              {annonces.length} annonce{annonces.length !== 1 ? 's' : ''} publiee{annonces.length !== 1 ? 's' : ''}
            </p>
            <Link to="/post-service" className="btn btn-primary" style={{ fontSize: 13 }}>
              + Nouvelle annonce
            </Link>
          </div>

          {annoncesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(function(i) {
                return (
                  <div key={i} className={styles.annonceCard}>
                    <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 13, width: '40%' }} />
                  </div>
                )
              })}
            </div>
          ) : annonces.length === 0 ? (
            <div className={styles.empty}>
              <div style={{ fontSize: 48 }}>📋</div>
              <p>Vous n'avez pas encore d'annonce publiee.</p>
              <p style={{ fontSize: 13, color: '#aaa' }}>
                Publiez votre premiere annonce pour etre visible par les clients.
              </p>
              <Link to="/post-service" className="btn btn-primary" style={{ marginTop: 4 }}>
                Publier une annonce
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {annonces.map(function(ann) {
                return (
                  <div key={ann.id} className={styles.annonceCard}>
                    <div className={styles.annonceHeader}>
                      <div style={{ flex: 1 }}>
                        <div className={styles.annonceTitle}>{ann.title}</div>
                        <div className={styles.annonceMeta}>
                          <span>{ann.category}</span>
                          <span style={{ margin: '0 6px', color: '#ddd' }}>|</span>
                          <span>📍 {ann.city}</span>
                          <span style={{ margin: '0 6px', color: '#ddd' }}>|</span>
                          <span>🗓 {new Date(ann.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        {ann.is_active
                          ? <span className="badge badge-green">En ligne ✅</span>
                          : <span className="badge badge-amber">En attente ⏳</span>
                        }
                        <Link
                          to={'/service/' + ann.id}
                          style={{ fontSize: 12, color: '#1D9E75' }}
                        >
                          Voir l'annonce →
                        </Link>
                      </div>
                    </div>
                    <div className={styles.annonceFooter}>
                      <span className={styles.annoncePrice}>
                        {ann.price.toLocaleString('fr-FR')} FCFA
                        <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}> / {ann.price_unit}</span>
                      </span>
                      {!ann.is_active && (
                        <span style={{ fontSize: 12, color: '#BA7517' }}>
                          Verification en cours — visible sous 24h
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Parametres ── */}
      {tab === 'parametres' && (
        <div style={{ maxWidth: 520 }}>
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
              Modifier mon profil
            </h2>

            {saveSuccess && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                ✅ Profil mis a jour avec succes.
              </div>
            )}
            {saveError && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                {saveError}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.full_name}
                  onChange={function(e) { setField('full_name', e.target.value) }}
                  required
                  placeholder="Ama Kouassi"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telephone *</label>
                  <input
                    className="form-input"
                    type="tel"
                    value={form.phone}
                    onChange={function(e) { setField('phone', e.target.value) }}
                    required
                    placeholder="+225 07 XX XX XX"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    WhatsApp
                    <span style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}>(optionnel)</span>
                  </label>
                  <input
                    className="form-input"
                    type="tel"
                    value={form.whatsapp}
                    onChange={function(e) { setField('whatsapp', e.target.value) }}
                    placeholder="+225 07 XX XX XX"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ville</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.city}
                  onChange={function(e) { setField('city', e.target.value) }}
                  placeholder="Abidjan"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio / Presentation</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.bio}
                  onChange={function(e) { setField('bio', e.target.value) }}
                  placeholder="Decrivez-vous en quelques mots : votre metier, votre experience..."
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={saving}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>

          {/* Account info */}
          <div className="card" style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
              Informations du compte
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#888' }}>Adresse e-mail</span>
                <span style={{ fontWeight: 500 }}>{user.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#888' }}>Statut</span>
                <span style={{ color: '#1D9E75', fontWeight: 500 }}>
                  {isVerified ? 'Verifie ✓' : 'Non verifie'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#888' }}>Membre depuis</span>
                <span>{new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ marginTop: 16, padding: 16, border: '1px solid #fde', borderRadius: 12, background: '#fff9f9' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#c00', marginBottom: 8 }}>
              Zone de danger
            </div>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              La deconnexion vous redirigera vers la page d'accueil.
            </p>
            <button
              className="btn btn-outline"
              style={{ fontSize: 13, borderColor: '#fcc', color: '#c00' }}
              onClick={handleSignOut}
            >
              Se deconnecter
            </button>
          </div>
        </div>
      )}

    </div>
  )
}