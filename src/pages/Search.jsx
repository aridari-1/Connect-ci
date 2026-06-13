import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useServices } from '../hooks/useServices'
import ServiceCard from '../components/ServiceCard'
import styles from './Search.module.css'

const CATEGORIES = [
  'Plomberie', 'Electricite', 'Coiffure Femme', 'Coiffure Homme',
  'Jardinage', 'Menage', 'Transport & Livraison',
  'Cuisine a domicile / Traiteur', 'Reparation telephones & electronique',
  'Construction', 'Beaute & Bien-etre', 'Cours particuliers',
  'Securite', 'Climatisation & Froid', 'Couture & Retouches',
  'Photographe & Videaste', 'Demenagement', 'Mecanicien',
  'Menuisier', 'Cordonnier', 'Vidange fosse septique', 'Chauffeur',
]

const CITIES = [
  'Abidjan', 'Bouake', 'Yamoussoukro', 'Daloa',
  'San Pedro', 'Korhogo', 'Divo', 'Gagnoa', 'Man',
]

const SORT_OPTIONS = [
  { value: 'recent',     label: 'Plus recents' },
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix decroissant' },
  { value: 'rating',     label: 'Mieux notes' },
]

const PRICE_RANGES = [
  { label: 'Tous les prix', min: 0,      max: 999999 },
  { label: 'Moins de 5 000 FCFA',  min: 0, max: 4999   },
  { label: '5 000 - 20 000 FCFA',  min: 5000, max: 20000 },
  { label: '20 000 - 50 000 FCFA', min: 20001, max: 50000 },
  { label: 'Plus de 50 000 FCFA',  min: 50001, max: 999999 },
]

export default function Search() {
  var [searchParams, setSearchParams] = useSearchParams()

  var [query, setQuery]       = useState(searchParams.get('q') || '')
  var [category, setCategory] = useState(searchParams.get('cat') || '')
  var [city, setCity]         = useState(searchParams.get('city') || '')
  var [sortBy, setSortBy]     = useState(searchParams.get('sort') || 'recent')
  var [priceIdx, setPriceIdx] = useState(0)
  var [showFilters, setShowFilters] = useState(false)

  // Sync state into URL so links are shareable
  useEffect(function() {
    var p = {}
    if (query)    p.q    = query
    if (category) p.cat  = category
    if (city)     p.city = city
    if (sortBy !== 'recent') p.sort = sortBy
    setSearchParams(p, { replace: true })
  }, [query, category, city, sortBy])

  var { services, loading } = useServices({
    search: query || undefined,
    category: category || undefined,
    city: city || undefined,
    limit: 40,
  })

  function getSorted(list) {
    if (!list) return []
    var copy = list.slice()
    var range = PRICE_RANGES[priceIdx]
    copy = copy.filter(function(s) { return s.price >= range.min && s.price <= range.max })
    if (sortBy === 'price_asc')  return copy.sort(function(a, b) { return a.price - b.price })
    if (sortBy === 'price_desc') return copy.sort(function(a, b) { return b.price - a.price })
    if (sortBy === 'rating')     return copy.sort(function(a, b) { return (b.avg_rating || 0) - (a.avg_rating || 0) })
    return copy
  }

  var results = getSorted(services)
  var hasFilter = query || category || city || priceIdx > 0

  function reset() {
    setQuery('')
    setCategory('')
    setCity('')
    setSortBy('recent')
    setPriceIdx(0)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f8f9fa' }}>

      {/* ── Search bar header ── */}
      <div className={styles.header}>
        <div className="container">
          <form
            className={styles.searchBar}
            onSubmit={function(e) { e.preventDefault() }}
          >
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Plombier, coiffeur, mecanicien..."
              value={query}
              onChange={function(e) { setQuery(e.target.value) }}
              autoFocus
            />
            {query && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={function() { setQuery('') }}
              >
                ✕
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="container" style={{ padding: '20px 16px 60px' }}>
        <div className={styles.layout}>

          {/* ── Filters sidebar ── */}
          <aside className={styles.sidebar + (showFilters ? ' ' + styles.sidebarOpen : '')}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarTitle}>Filtres</span>
              {hasFilter && (
                <button className={styles.resetBtn} onClick={reset}>
                  Reinitialiser
                </button>
              )}
            </div>

            {/* Category */}
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Categorie</div>
              <select
                className="form-input"
                value={category}
                onChange={function(e) { setCategory(e.target.value) }}
              >
                <option value="">Toutes les categories</option>
                {CATEGORIES.map(function(c) {
                  return <option key={c} value={c}>{c}</option>
                })}
              </select>
            </div>

            {/* City */}
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Ville</div>
              <select
                className="form-input"
                value={city}
                onChange={function(e) { setCity(e.target.value) }}
              >
                <option value="">Toutes les villes</option>
                {CITIES.map(function(c) {
                  return <option key={c} value={c}>{c}</option>
                })}
              </select>
            </div>

            {/* Price range */}
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Fourchette de prix</div>
              {PRICE_RANGES.map(function(range, i) {
                return (
                  <button
                    key={i}
                    className={styles.priceBtn + (priceIdx === i ? ' ' + styles.priceBtnActive : '')}
                    onClick={function() { setPriceIdx(i) }}
                  >
                    {range.label}
                  </button>
                )
              })}
            </div>

            {/* Sort */}
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Trier par</div>
              {SORT_OPTIONS.map(function(opt) {
                return (
                  <button
                    key={opt.value}
                    className={styles.priceBtn + (sortBy === opt.value ? ' ' + styles.priceBtnActive : '')}
                    onClick={function() { setSortBy(opt.value) }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </aside>

          {/* ── Results ── */}
          <div className={styles.results}>

            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.resultCount}>
                {loading
                  ? 'Recherche...'
                  : results.length + ' annonce' + (results.length !== 1 ? 's' : '') + ' trouvee' + (results.length !== 1 ? 's' : '')
                }
                {query && ' pour "' + query + '"'}
              </div>

              <button
                className={styles.filterToggle}
                onClick={function() { setShowFilters(!showFilters) }}
              >
                ⚙️ Filtres {hasFilter ? '●' : ''}
              </button>
            </div>

            {/* Active filter pills */}
            {hasFilter && (
              <div className={styles.pills}>
                {query && (
                  <span className={styles.pill}>
                    "{query}"
                    <button onClick={function() { setQuery('') }}>✕</button>
                  </span>
                )}
                {category && (
                  <span className={styles.pill}>
                    {category}
                    <button onClick={function() { setCategory('') }}>✕</button>
                  </span>
                )}
                {city && (
                  <span className={styles.pill}>
                    {city}
                    <button onClick={function() { setCity('') }}>✕</button>
                  </span>
                )}
                {priceIdx > 0 && (
                  <span className={styles.pill}>
                    {PRICE_RANGES[priceIdx].label}
                    <button onClick={function() { setPriceIdx(0) }}>✕</button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className={styles.grid}>
                {[1,2,3,4,5,6].map(function(i) {
                  return (
                    <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
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
            ) : results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
                <p style={{ fontSize: 16, marginBottom: 8 }}>Aucune annonce trouvee</p>
                <p style={{ fontSize: 13, marginBottom: 24 }}>
                  Essayez un autre mot-cle ou reinitialisez les filtres.
                </p>
                <button className="btn btn-outline" onClick={reset}>
                  Reinitialiser les filtres
                </button>
                <div style={{ marginTop: 24 }}>
                  <Link to="/" style={{ fontSize: 13, color: '#1D9E75' }}>
                    Retour a l'accueil
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.grid}>
                {results.map(function(svc) {
                  return <ServiceCard key={svc.id} service={svc} />
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}