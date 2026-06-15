import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createService } from '../hooks/useServices'
import { supabase } from '../lib/supabase'
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
  'Wedding Planner',
  'Peintre',
  'Staffeur',
]

const CITIES = [
  'Abidjan', 'Bouake', 'Yamoussoukro', 'Daloa', 'San Pedro', 'Korhogo',
  'Divo', 'Gagnoa', 'Man', 'Abengourou', 'Soubre',
]

export default function PostService() {
  var { user, profile } = useAuth()
  var navigate = useNavigate()

  var [form, setForm] = useState({
    title:        '',
    category:     '',
    description:  '',
    price:        '',
    price_unit:   'par intervention',
    city:         (profile && profile.city) ? profile.city : 'Abidjan',
    phone:        (profile && profile.phone) ? profile.phone : '',
    whatsapp:     '',
    availability: 'Lundi-Vendredi 8h-18h',
    experience:   '',
    tags:         '',
  })

  var [loading, setLoading]             = useState(false)
  var [error, setError]                 = useState('')
  var [lockedCategory, setLockedCategory] = useState('')
  var [activeCount, setActiveCount]     = useState(null)

  // Redirect if not logged in
  if (!user) {
    navigate('/login?redirect=/post-service')
    return null
  }

  // On mount: fetch the provider's locked category and active listing count
  useEffect(function() {
    if (!user) return

    supabase
      .from('profiles')
      .select('provider_category')
      .eq('id', user.id)
      .single()
      .then(function(res) {
        if (res.data && res.data.provider_category) {
          var cat = res.data.provider_category
          setLockedCategory(cat)
          setForm(function(prev) {
            return Object.assign({}, prev, { category: cat })
          })
        }
      })

    supabase
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', user.id)
      .eq('is_active', true)
      .then(function(res) {
        setActiveCount(res.count || 0)
      })
  }, [user])

  function set(field, value) {
    setForm(function(prev) {
      var next = Object.assign({}, prev)
      next[field] = value
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // ── Guard: category must be valid ──
    if (!form.category) {
      setError('Veuillez choisir une categorie.')
      return
    }
    if (ALLOWED_CATEGORIES.indexOf(form.category) === -1) {
      setError('Categorie non autorisee.')
      return
    }

    // ── Guard: phone required ──
    if (!form.phone) {
      setError('Le numero de telephone est obligatoire.')
      return
    }

    // ── Guard: price minimum ──
    if (Number(form.price) < 500) {
      setError('Le prix minimum est de 500 FCFA.')
      return
    }

    setLoading(true)

    try {
      // ── Check 1: max 4 active listings ──
      var countRes = await supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', user.id)
        .eq('is_active', true)

      var currentCount = countRes.count || 0

      if (currentCount >= 4) {
        setError(
          'Vous avez atteint la limite de 4 annonces actives. ' +
          'Rendez-vous dans "Mes annonces" pour supprimer une annonce avant d\'en publier une nouvelle.'
        )
        setLoading(false)
        return
      }

      // ── Check 2: category lock ──
      var profileRes = await supabase
        .from('profiles')
        .select('provider_category')
        .eq('id', user.id)
        .single()

      var existingCat = profileRes.data && profileRes.data.provider_category

      if (existingCat) {
        // Provider already has a locked category
        if (existingCat !== form.category) {
          setError(
            'Vous etes inscrit comme prestataire "' + existingCat + '". ' +
            'Vous ne pouvez publier que dans cette categorie.'
          )
          setLoading(false)
          return
        }
      } else {
        // First listing — lock this category to the provider's profile
        await supabase
          .from('profiles')
          .update({ provider_category: form.category })
          .eq('id', user.id)
        setLockedCategory(form.category)
      }

      // ── Publish the listing ──
      var tagList = form.tags
        .split(',')
        .map(function(t) { return t.trim() })
        .filter(Boolean)

      await createService({
        provider_id:  user.id,
        title:        form.title.trim(),
        category:     form.category,
        description:  form.description.trim(),
        price:        Number(form.price),
        price_unit:   form.price_unit,
        city:         form.city,
        phone:        form.phone.trim(),
        whatsapp:     form.whatsapp.trim() || null,
        availability: form.availability,
        experience:   form.experience,
        tags:         tagList,
        is_active:    false,   // pending admin review
        images:       [],
      })

      navigate('/annonce-publiee')

    } catch (err) {
      setError('Erreur lors de la publication : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Listing limit warning banner ──
  var limitReached  = activeCount !== null && activeCount >= 4
  var nearLimit     = activeCount !== null && activeCount === 3

  return (
    <div className="container" style={{ padding: '32px 16px 60px', maxWidth: 680 }}>
      <h1 className={styles.pageTitle}>Publier une annonce</h1>
      <p className={styles.pageSub}>
        Votre annonce sera verifiee et mise en ligne sous 24h.
      </p>

      {/* Listing count indicator */}
      {activeCount !== null && (
        <div className={limitReached ? 'alert alert-error' : nearLimit ? 'alert alert-info' : 'alert alert-success'}
          style={{ marginBottom: 16 }}>
          {limitReached
            ? 'Limite atteinte : vous avez 4 annonces actives sur 4 autorisees. Supprimez une annonce pour en publier une nouvelle.'
            : nearLimit
              ? 'Attention : vous avez ' + activeCount + '/4 annonces actives. Il vous reste 1 emplacement.'
              : 'Vous avez ' + activeCount + '/4 annonces actives.'
          }
        </div>
      )}

      {/* Category lock notice */}
      {lockedCategory && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Votre compte est enregistre dans la categorie <strong>{lockedCategory}</strong>.
          Toutes vos annonces doivent etre dans cette categorie.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>

        {/* ── General info ── */}
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
              disabled={!!lockedCategory}
              style={lockedCategory ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
            >
              <option value="">Selectionner une categorie</option>
              {ALLOWED_CATEGORIES.map(function(c) {
                return <option key={c} value={c}>{c}</option>
              })}
            </select>
            {lockedCategory && (
              <div style={{ fontSize: 12, color: '#888', marginTop: 5 }}>
                Categorie fixee — vous ne pouvez publier que dans : <strong style={{ color: '#085041' }}>{lockedCategory}</strong>
              </div>
            )}
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

        {/* ── Pricing ── */}
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
              <label className="form-label">Unite</label>
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

        {/* ── Location & Contact ── */}
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
                {CITIES.map(function(c) {
                  return <option key={c} value={c}>{c}</option>
                })}
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
              <span style={{ fontWeight: 400, color: '#aaa', marginLeft: 6 }}>
                (optionnel — si different du telephone)
              </span>
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
              placeholder="ex: 5 ans d'experience, certifie, formation professionnelle..."
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

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading || limitReached}
        >
          {loading ? 'Publication en cours...' : 'Publier mon annonce'}
        </button>
      </form>
    </div>
  )
}