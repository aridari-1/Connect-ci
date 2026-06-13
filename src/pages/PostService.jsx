import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createService } from '../hooks/useServices'
import styles from './PostService.module.css'

const ALLOWED_CATEGORIES = [
  'Plomberie',
  'Electricite',
  'Coiffure Femme',
  'Coiffure Homme',
  'Jardinage',
  'Menage',
  'Transport & Livraison',
  'Cuisine a domicile / Traiteur',
  'Reparation telephones & electronique',
  'Construction',
  'Beaute & Bien-etre',
  'Cours particuliers',
  'Securite',
  'Climatisation & Froid',
  'Couture & Retouches',
  'Photographe & Videaste',
  'Demenagement',
  'Mecanicien',
  'Menuisier',
  'Cordonnier',
  'Vidange fosse septique',
  'Chauffeur',
]

const CITIES = [
  'Abidjan', 'Bouake', 'Yamoussoukro', 'Daloa', 'San Pedro', 'Korhogo',
  'Divo', 'Gagnoa', 'Man', 'Abengourou', 'Soubre',
]

export default function PostService() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    price_unit: 'par intervention',
    city: (profile && profile.city) ? profile.city : 'Abidjan',
    phone: (profile && profile.phone) ? profile.phone : '',
    whatsapp: '',
    availability: 'Lundi-Vendredi 8h-18h',
    experience: '',
    tags: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    navigate('/login?redirect=/post-service')
    return null
  }

  function set(field, value) {
    setForm(function(prev) {
      var next = Object.assign({}, prev)
      next[field] = value
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.category) {
      setError('Veuillez choisir une categorie.')
      return
    }
    if (ALLOWED_CATEGORIES.indexOf(form.category) === -1) {
      setError('Categorie non autorisee.')
      return
    }
    if (!form.phone) {
      setError('Le numero de telephone est obligatoire.')
      return
    }
    if (Number(form.price) < 500) {
      setError('Le prix minimum est de 500 FCFA.')
      return
    }

    setLoading(true)
    setError('')

    try {
      var tagList = form.tags.split(',').map(function(t) { return t.trim() }).filter(Boolean)
      var service = await createService({
        provider_id: user.id,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        price: Number(form.price),
        price_unit: form.price_unit,
        city: form.city,
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || null,
        availability: form.availability,
        experience: form.experience,
        tags: tagList,
        is_active: false,
        images: [],
      })
      navigate('/annonce-publiee')
    } catch (err) {
      setError('Erreur lors de la publication : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: '32px 16px 60px', maxWidth: 680 }}>
      <h1 className={styles.pageTitle}>Publier mon annonce</h1>
      <p className={styles.pageSub}>
        Votre annonce sera verifiee et mise en ligne sous 24h apres validation.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>

        {/* General info */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className={styles.sectionTitle}>Informations generales</h2>

          <div className="form-group">
            <label className="form-label">Titre de l'annonce *</label>
            <input
              className="form-input"
              type="text"
              placeholder="ex: Plombier urgence disponible 24h/7j a Abidjan"
              value={form.title}
              onChange={function(e) { set('title', e.target.value) }}
              required
              maxLength={100}
            />
            <div className={styles.charCount}>{form.title.length}/100</div>
          </div>

          <div className="form-group">
            <label className="form-label">Categorie *</label>
            <select
              className="form-input"
              value={form.category}
              onChange={function(e) { set('category', e.target.value) }}
              required
            >
              <option value="">Selectionner une categorie</option>
              {ALLOWED_CATEGORIES.map(function(c) {
                return <option key={c} value={c}>{c}</option>
              })}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description detaillee *</label>
            <textarea
              className="form-input"
              rows={5}
              placeholder="Decrivez votre experience, vos competences, ce que vous proposez exactement... (50 caracteres minimum)"
              value={form.description}
              onChange={function(e) { set('description', e.target.value) }}
              required
              minLength={50}
            />
            <div className={styles.charCount}>{form.description.length} caracteres</div>
          </div>

          <div className="form-group">
            <label className="form-label">Mots-cles (separes par des virgules)</label>
            <input
              className="form-input"
              type="text"
              placeholder="urgence, devis gratuit, rapide, domicile..."
              value={form.tags}
              onChange={function(e) { set('tags', e.target.value) }}
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className={styles.sectionTitle}>Tarif</h2>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prix indicatif (FCFA) *</label>
              <input
                className="form-input"
                type="number"
                min="500"
                step="500"
                placeholder="10000"
                value={form.price}
                onChange={function(e) { set('price', e.target.value) }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unite de prix</label>
              <select
                className="form-input"
                value={form.price_unit}
                onChange={function(e) { set('price_unit', e.target.value) }}
              >
                <option>par intervention</option>
                <option>par heure</option>
                <option>par jour</option>
                <option>par semaine</option>
                <option>par mois</option>
                <option>sur devis</option>
                <option>par session</option>
                <option>par voyage</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location & contact */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className={styles.sectionTitle}>Localisation et Contact</h2>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ville *</label>
              <select
                className="form-input"
                value={form.city}
                onChange={function(e) { set('city', e.target.value) }}
              >
                {CITIES.map(function(c) { return <option key={c} value={c}>{c}</option> })}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Telephone *</label>
              <input
                className="form-input"
                type="tel"
                placeholder="+225 07 XX XX XX"
                value={form.phone}
                onChange={function(e) { set('phone', e.target.value) }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Numero WhatsApp
              <span style={{ fontWeight: 400, color: '#aaa', marginLeft: 6 }}>(optionnel — si different du telephone)</span>
            </label>
            <input
              className="form-input"
              type="tel"
              placeholder="+225 07 XX XX XX"
              value={form.whatsapp}
              onChange={function(e) { set('whatsapp', e.target.value) }}
            />
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
              Laissez vide si c'est le meme numero que votre telephone.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Disponibilites</label>
            <input
              className="form-input"
              type="text"
              placeholder="ex: Lundi-Samedi 7h-20h, disponible week-end"
              value={form.availability}
              onChange={function(e) { set('availability', e.target.value) }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Experience</label>
            <input
              className="form-input"
              type="text"
              placeholder="ex: 5 ans d'experience, certifie, formation..."
              value={form.experience}
              onChange={function(e) { set('experience', e.target.value) }}
            />
          </div>
        </div>

        <div className={styles.terms}>
          En publiant, vous acceptez que votre annonce soit soumise a verification (sous 24h)
          et vous vous engagez a respecter nos{' '}
          <a href="/terms">conditions d'utilisation</a>.
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? 'Publication en cours...' : 'Publier mon annonce'}
        </button>
      </form>
    </div>
  )
}