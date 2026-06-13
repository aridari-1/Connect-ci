import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServices } from '../hooks/useServices'
import ServiceCard from '../components/ServiceCard'
import styles from './Home.module.css'

const CATEGORIES = [
  { name: 'Plomberie',                          icon: '🔧' },
  { name: 'Electricite',                        icon: '⚡' },
  { name: 'Coiffure Femme',                     icon: '💇' },
  { name: 'Coiffure Homme',                     icon: '💈' },
  { name: 'Jardinage',                          icon: '🌿' },
  { name: 'Menage',                             icon: '🏠' },
  { name: 'Transport & Livraison',              icon: '🚛' },
  { name: 'Cuisine a domicile / Traiteur',      icon: '👨‍🍳' },
  { name: 'Reparation telephones & electronique', icon: '📱' },
  { name: 'Construction',                       icon: '🏗️' },
  { name: 'Beaute & Bien-etre',                 icon: '✨' },
  { name: 'Cours particuliers',                 icon: '📚' },
  { name: 'Securite',                           icon: '🛡️' },
  { name: 'Climatisation & Froid',             icon: '❄️' },
  { name: 'Couture & Retouches',                icon: '🧵' },
  { name: 'Photographe & Videaste',            icon: '📷' },
  { name: 'Demenagement',                       icon: '📦' },
  { name: 'Mecanicien',                         icon: '🔩' },
  { name: 'Menuisier',                          icon: '🪚' },
  { name: 'Cordonnier',                         icon: '👟' },
  { name: 'Vidange fosse septique',             icon: '🚰' },
  { name: 'Chauffeur',                          icon: '🚗' },
]

const CITIES = [
  'Toutes les villes', 'Abidjan', 'Bouake', 'Yamoussoukro',
  'Daloa', 'San Pedro', 'Korhogo', 'Divo', 'Gagnoa', 'Man'
]

const SORT_OPTIONS = [
  { value: 'recent',     label: 'Plus récents' },
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'rating',     label: 'Mieux notés' },
]

export default function Home() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeCity, setActiveCity] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [showFilters, setShowFilters] = useState(false)

  const { services, loading } = useServices({
    city: activeCity || undefined,
    category: activeCategory || undefined,
    search: search || undefined,
    limit: 24
  })

  // Client-side sort
  function getSorted(list) {
    if (!list) return []
    const copy = [...list]
    if (sortBy === 'price_asc')  return copy.sort(function(a, b) { return a.price - b.price })
    if (sortBy === 'price_desc') return copy.sort(function(a, b) { return b.price - a.price })
    if (sortBy === 'rating')     return copy.sort(function(a, b) { return (b.avg_rating || 0) - (a.avg_rating || 0) })
    return copy // 'recent' — already ordered by created_at from Supabase
  }

  const sorted = getSorted(services)
  const hasFilter = activeCategory || activeCity || search

  function handleSearch(e) {
    e.preventDefault()
    // search is live via useServices
  }

  function reset() {
    setActiveCategory('')
    setActiveCity('')
    setSearch('')
    setSortBy('recent')
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Trouvez le bon professionnel
            <span> en Cote d'Ivoire</span>
          </h1>
          <p className={styles.heroSub}>
            Prestataires verifies — contactez-les directement et gratuitement.
          </p>

          <form className={styles.searchBar} onSubmit={handleSearch}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Plombier, coiffeur, mecanicien..."
              value={search}
              onChange={function(e) { setSearch(e.target.value) }}
              className={styles.searchInput}
            />
            {search && (
              <button
                type="button"
                onClick={function() { setSearch('') }}
                className={styles.clearBtn}
              >
                ✕
              </button>
            )}
            <button type="submit" className="btn btn-primary">Chercher</button>
          </form>

          <div className={styles.cityTabs}>
            {CITIES.map(function(city) {
              var isActive = (city === 'Toutes les villes' ? '' : city) === activeCity
              return (
                <button
                  key={city}
                  className={styles.cityTab + (isActive ? ' ' + styles.activeTab : '')}
                  onClick={function() { setActiveCity(city === 'Toutes les villes' ? '' : city) }}
                >
                  {city}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className={styles.statsBar}>
        <div className="container">
          <div className={styles.stats}>
            <div className={styles.stat}><strong>100%</strong> Gratuit pour les clients</div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>22</strong> categories de services</div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>Contact</strong> direct WhatsApp</div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>Prestataires</strong> verifies</div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 16px' }}>

        {/* ── Categories ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Catégories</h2>
          <div className={styles.catGrid}>
            {CATEGORIES.map(function(cat) {
              var isActive = activeCategory === cat.name
              return (
                <button
                  key={cat.name}
                  className={styles.catCard + (isActive ? ' ' + styles.catActive : '')}
                  onClick={function() { setActiveCategory(isActive ? '' : cat.name) }}
                >
                  <div className={styles.catIcon}>{cat.icon}</div>
                  <div className={styles.catName}>{cat.name}</div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Listings ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {activeCategory
                ? activeCategory
                : activeCity
                  ? 'Annonces a ' + activeCity
                  : search
                    ? 'Resultats pour "' + search + '"'
                    : 'Annonces recentes'
              }
            </h2>

            <div className={styles.sortRow}>
              {/* Sort dropdown */}
              <div className={styles.sortWrap}>
                <label className={styles.sortLabel}>Trier :</label>
                <select
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={function(e) { setSortBy(e.target.value) }}
                >
                  {SORT_OPTIONS.map(function(o) {
                    return <option key={o.value} value={o.value}>{o.label}</option>
                  })}
                </select>
              </div>

              {hasFilter && (
                <button className="btn btn-outline" style={{ fontSize: 13, padding: '6px 14px' }} onClick={reset}>
                  Reinitialiser ✕
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className={styles.grid}>
              {[1,2,3,4,5,6].map(function(i) {
                return (
                  <div key={i} className={styles.skeletonCard}>
                    <div className="skeleton" style={{ height: 120 }} />
                    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="skeleton" style={{ height: 16, width: '70%' }} />
                      <div className="skeleton" style={{ height: 12, width: '50%' }} />
                      <div className="skeleton" style={{ height: 14, width: '40%', marginTop: 8 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : sorted.length === 0 ? (
            <div className={styles.empty}>
              <div style={{ fontSize: 48 }}>🔍</div>
              <p>Aucune annonce trouvee pour ce filtre.</p>
              <button className="btn btn-outline" onClick={reset}>
                Voir toutes les annonces
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {sorted.map(function(svc) {
                return <ServiceCard key={svc.id} service={svc} />
              })}
            </div>
          )}
        </section>

        {/* ── Provider CTA ── */}
        <section className={styles.ctaSection}>
          <h2>Vous etes prestataire ?</h2>
          <p>
            Inscrivez-vous pour <strong>500 FCFA</strong> seulement et publiez votre annonce.
            Des milliers de clients vous trouvent chaque jour, gratuitement.
          </p>
          <button
            className="btn btn-primary btn-lg"
            style={{ maxWidth: 320, margin: '0 auto' }}
            onClick={function() { navigate('/signup') }}
          >
            Publier mon annonce — 500 FCFA
          </button>
        </section>

      </div>
    </div>
  )
}