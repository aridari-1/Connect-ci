import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { payRegistrationFee } from '../lib/paystack'
import styles from './Auth.module.css'

// ── Login Page ────────────────────────────────────────────
export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(form)
      navigate(redirect)
    } catch (err) {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Service<span>CI</span></div>
        <h1 className={styles.title}>Se connecter</h1>
        <p className={styles.sub}>Espace réservé aux prestataires.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Adresse e-mail</label>
            <input
              type="email"
              className="form-input"
              placeholder="vous@exemple.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: '#1D9E75' }}>
              Mot de passe oublié ?
            </Link>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className={styles.divider}><span>ou</span></div>
        <p className={styles.switch}>
          Pas encore inscrit ?{' '}
          <Link to="/signup">Créer un compte prestataire — 500 FCFA</Link>
        </p>
      </div>
    </div>
  )
}

// ── Signup Page ───────────────────────────────────────────
export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: 'Abidjan',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await new Promise((resolve, reject) => {
        payRegistrationFee({
          email: form.email,
          name: form.fullName,
          phone: form.phone,
          onSuccess: async (response) => {
            try {
              await signUp({ ...form, paystackRef: response.reference })
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          onClose: () => {
            setLoading(false)
            reject(new Error('cancelled'))
          }
        })
      })
      setSuccess(true)
    } catch (err) {
      if (err.message === 'cancelled') return
      setError(err.message || 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className={styles.page}>
      <div className={styles.card} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
        <h2 style={{ marginBottom: 12 }}>Paiement reçu !</h2>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.7 }}>
          Un lien de confirmation a été envoyé à <strong>{form.email}</strong>.<br />
          Cliquez sur le lien pour activer votre compte et publier votre annonce.
        </p>
        <button
          className="btn btn-primary btn-lg"
          style={{ marginTop: 24 }}
          onClick={() => navigate('/login')}
        >
          Aller à la connexion
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Service<span>CI</span></div>
        <h1 className={styles.title}>Créer un compte prestataire</h1>

        {/* Registration fee notice */}
        <div style={{
          background: '#E1F5EE',
          border: '1px solid #9FE1CB',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 13,
          color: '#085041',
          lineHeight: 1.6
        }}>
          🔒 Inscription unique à <strong>500 FCFA</strong> — payable par carte,
          MTN MoMo, Orange Money ou Wave.
          Votre annonce sera visible après vérification (sous 24h).
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nom complet</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ama Kouassi"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Adresse e-mail</label>
            <input
              type="email"
              className="form-input"
              placeholder="vous@exemple.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Téléphone (WhatsApp)</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+225 07 XX XX XX"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ville</label>
              <select
                className="form-input"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
              >
                {['Abidjan','Bouaké','Yamoussoukro','Daloa','San Pédro','Korhogo',
                  'Divo','Gagnoa','Man','Abengourou','Soubré'].map(c =>
                  <option key={c}>{c}</option>
                )}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-input"
                placeholder="8 caractères min."
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Ouverture du paiement...' : 'Continuer vers le paiement — 500 FCFA →'}
          </button>
        </form>

        <p className={styles.switch} style={{ marginTop: 16 }}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
        <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 8 }}>
          En vous inscrivant, vous acceptez nos{' '}
          <Link to="/terms">Conditions d'utilisation</Link>.
        </p>
      </div>
    </div>
  )
}