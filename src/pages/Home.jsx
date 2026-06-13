import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServices } from '../hooks/useServices'
import ServiceCard from '../components/ServiceCard'
import styles from './Home.module.css'

const CATEGORIES = [
  { name: 'Plomberie',                            icon: '🔧' },
  { name: 'Electricite',                          icon: '⚡' },
  { name: 'Coiffure Femme',                       icon: '💇' },
  { name: 'Coiffure Homme',                       icon: '💈' },
  { name: 'Jardinage',                            icon: '🌿' },
  { name: 'Menage',                               icon: '🏠' },
  { name: 'Transport & Livraison',                icon: '🚛' },
  { name: 'Cuisine a domicile / Traiteur',        icon: '👨‍🍳' },
  { name: 'Reparation telephones & electronique', icon: '📱' },
  { name: 'Construction',                         icon: '🏗️' },
  { name: 'Beaute & Bien-etre',                   icon: '✨' },
  { name: 'Cours particuliers',                   icon: '📚' },
  { name: 'Securite',                             icon: '🛡️' },
  { name: 'Climatisation & Froid',                icon: '❄️' },
  { name: 'Couture & Retouches',                  icon: '🧵' },
  { name: 'Photographe & Videaste',               icon: '📷' },
  { name: 'Demenagement',                         icon: '📦' },
  { name: 'Mecanicien',                           icon: '🔩' },
  { name: 'Menuisier',                            icon: '🪚' },
  { name: 'Cordonnier',                           icon: '👟' },
  { name: 'Vidange fosse septique',               icon: '🚰' },
  { name: 'Chauffeur',                            icon: '🚗' },
]

const CITIES = [
  'Toutes les villes', 'Abidjan', 'Bouake', 'Yamoussoukro',
  'Daloa', 'San Pedro', 'Korhogo', 'Divo', 'Gagnoa', 'Man'
]

const SORT_OPTIONS = [
  { value: 'recent',     label: 'Plus recents'    },
  { value: 'price_asc',  label: 'Prix croissant'  },
  { value: 'price_desc', label: 'Prix decroissant' },
  { value: 'rating',     label: 'Mieux notes'     },
]

export default function Home() {
  var navigate = useNavigate()
  var [search, setSearch]               = useState('')
  var [activeCity, setActiveCity]       = useState('')
  var [activeCategory, setActiveCategory] = useState('')
  var [sortBy, setSortBy]               = useState('recent')

  var { services, loading } = useServices({
    city:     activeCity    || undefined,
    category: activeCategory || undefined,
    search:   search        || undefined,
    limit:    24,
  })

  function getSorted(list) {
    if (!list) return []
    var copy = list.slice()
    if (sortBy === 'price_asc')  return copy.sort(function(a, b) { return a.price - b.price })
    if (sortBy === 'price_desc') return copy.sort(function(a, b) { return b.price - a.price })
    if (sortBy === 'rating')     return copy.sort(function(a, b) { return (b.avg_rating || 0) - (a.avg_rating || 0) })
    return copy
  }

  var sorted    = getSorted(services)
  var hasFilter = activeCategory || activeCity || search

  function reset() {
    setActiveCategory('')
    setActiveCity('')
    setSearch('')
    setSortBy('recent')
  }

  function handleSearch(e) {
    e.preventDefault()
  }

  return (
    <div className={styles.page}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroLabel}>Cote d'Ivoire</div>
        <h1 className={styles.heroTitle}>
          Trouvez le bon
          <br />professionnel
        </h1>
        <p className={styles.heroSub}>
          Prestataires verifies — contact direct WhatsApp, 100% gratuit pour les clients.
        </p>

        {/* Search */}
        <form className={styles.searchBar} onSubmit={handleSearch}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Plombier, coiffeur, mecanicien..."
            value={search}
            onChange={function(e) { setSearch(e.target.value) }}
            className={styles.searchInput}
          />
          {search
            ? (
              <button type="button" className={styles.clearBtn} onClick={function() { setSearch('') }}>
                ✕
              </button>
            )
            : null
          }
        </form>

        {/* City pills — horizontal scroll */}
        <div className={styles.cityScroll}>
          {CITIES.map(function(city) {
            var val      = city === 'Toutes les villes' ? '' : city
            var isActive = val === activeCity
            return (
              <button
                key={city}
                className={styles.cityPill + (isActive ? ' ' + styles.cityPillActive : '')}
                onClick={function() { setActiveCity(val) }}
              >
                {city}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statItem}>
          <div className={styles.statVal}>100%</div>
          <div className={styles.statLbl}>Gratuit clients</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <div className={styles.statVal}>22</div>
          <div className={styles.statLbl}>Categories</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <div className={styles.statVal}>WhatsApp</div>
          <div className={styles.statLbl}>Contact direct</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <div className={styles.statVal}>Verifies</div>
          <div className={styles.statLbl}>Prestataires</div>
        </div>
      </div>

      {/* ── CATEGORIES — horizontal scroll on mobile, grid on desktop ── */}
      <div className={styles.sectionWrap}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Categories</h2>
          {activeCategory && (
            <button className={styles.seeAll} onClick={function() { setActiveCategory('') }}>
              Tout voir
            </button>
          )}
        </div>

        {/* Mobile: horizontal scroll */}
        <div className={styles.catScroll}>
          {CATEGORIES.map(function(cat) {
            var isActive = activeCategory === cat.name
            return (
              <button
                key={cat.name}
                className={styles.catChip + (isActive ? ' ' + styles.catChipActive : '')}
                onClick={function() { setActiveCategory(isActive ? '' : cat.name) }}
              >
                <div className={styles.catChipIcon}>{cat.icon}</div>
                <div className={styles.catChipName}>{cat.name}</div>
              </button>
            )
          })}
        </div>

        {/* Desktop: grid (hidden on mobile) */}
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
      </div>

      {/* ── LISTINGS ── */}
      <div className={styles.sectionWrap}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            {activeCategory
              ? activeCategory
              : activeCity
                ? 'Annonces a ' + activeCity
                : search
                  ? '"' + search + '"'
                  : 'Annonces recentes'
            }
          </h2>
          <div className={styles.sortRow}>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={function(e) { setSortBy(e.target.value) }}
            >
              {SORT_OPTIONS.map(function(o) {
                return <option key={o.value} value={o.value}>{o.label}</option>
              })}
            </select>
            {hasFilter && (
              <button className={styles.resetBtn} onClick={reset}>✕</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[1,2,3,4,5,6].map(function(i) {
              return (
                <div key={i} className={styles.skeletonCard}>
                  <div className="skeleton" style={{ height: 110 }} />
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ height: 14, width: '70%' }} />
                    <div className="skeleton" style={{ height: 11, width: '50%' }} />
                    <div className="skeleton" style={{ height: 13, width: '40%', marginTop: 6 }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : sorted.length === 0 ? (
          <div className={styles.empty}>
            <div style={{ fontSize: 44 }}>🔍</div>
            <p>Aucune annonce pour ce filtre.</p>
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
      </div>

      {/* ── CTA BANNER ── */}
      <div className={styles.ctaBanner}>
        <div className={styles.ctaText}>
          <div className={styles.ctaTitle}>Vous etes prestataire ?</div>
          <div className={styles.ctaSub}>
            Publiez votre annonce pour 500 FCFA et soyez visible partout en Cote d'Ivoire.
          </div>
        </div>
        <button
          className={styles.ctaBtn}
          onClick={function() { navigate('/signup') }}
        >
          500 FCFA
        </button>
      </div>

      {/* Bottom spacer so content isn't hidden behind bottom nav */}
      <div style={{ height: 80 }} />

      {/* ── BOTTOM NAV ── */}
      <nav className={styles.bottomNav}>
        <button className={styles.bnItem + ' ' + styles.bnActive}>
          <span className={styles.bnIcon}>🏠</span>
          <span className={styles.bnLabel}>Accueil</span>
          <span className={styles.bnDot} />
        </button>
        <button
          className={styles.bnItem}
          onClick={function() { navigate('/search') }}
        >
          <span className={styles.bnIcon}>🔍</span>
          <span className={styles.bnLabel}>Chercher</span>
        </button>
        <button
          className={styles.bnItem}
          onClick={function() { navigate('/post-service') }}
        >
          <span className={styles.bnIconPlus}>+</span>
          <span className={styles.bnLabel}>Publier</span>
        </button>
        <button
          className={styles.bnItem}
          onClick={function() { navigate('/profile') }}
        >
          <span className={styles.bnIcon}>👤</span>
          <span className={styles.bnLabel}>Profil</span>
        </button>
      </nav>

    </div>
  )
}