import { useParams, Link } from 'react-router-dom'
import { useService } from '../hooks/useServices'
import styles from './ServiceDetail.module.css'

const CATEGORY_ICONS = {
  'Plomberie':                            '🔧',
  'Electricite':                          '⚡',
  'Coiffure Femme':                       '💇',
  'Coiffure Homme':                       '💈',
  'Jardinage':                            '🌿',
  'Menage':                               '🏠',
  'Transport & Livraison':                '🚛',
  'Cuisine a domicile / Traiteur':        '👨‍🍳',
  'Reparation telephones & electronique': '📱',
  'Construction':                         '🏗️',
  'Beaute & Bien-etre':                   '✨',
  'Cours particuliers':                   '📚',
  'Securite':                             '🛡️',
  'Climatisation & Froid':               '❄️',
  'Couture & Retouches':                  '🧵',
  'Photographe & Videaste':              '📷',
  'Demenagement':                         '📦',
  'Mecanicien':                           '🔩',
  'Menuisier':                            '🪚',
  'Cordonnier':                           '👟',
  'Vidange fosse septique':               '🚰',
  'Chauffeur':                            '🚗',
}

export default function ServiceDetail() {
  const { id } = useParams()
  const { service, loading, error } = useService(id)

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 16px' }}>
        <div className="skeleton" style={{ height: 240, borderRadius: 16, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 120, marginBottom: 16 }} />
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="container" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <p style={{ color: '#888' }}>Annonce introuvable.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
          Retour
        </Link>
      </div>
    )
  }

  const provider = service.profiles
  const icon = CATEGORY_ICONS[service.category] || '🔨'

  // Phone number — required
  const phoneNumber = provider?.phone || service.phone || ''

  // WhatsApp — optional, falls back to phone if not set
  const whatsappRaw = service.whatsapp || provider?.whatsapp || phoneNumber
  const whatsappClean = whatsappRaw.replace(/\s+/g, '').replace('+', '')
  const whatsappMessage = 'Bonjour, j ai vu votre annonce sur ServiceCI pour ' + service.title + '. Je suis interesse(e).'
  const whatsappLink = 'https://wa.me/' + whatsappClean + '?text=' + encodeURIComponent(whatsappMessage)

  const hasWhatsapp = whatsappClean.length > 4
  const hasPhone = phoneNumber.length > 4

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(function(n) { return n[0] }).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="container" style={{ padding: '24px 16px 60px' }}>
      <Link to="/" className={styles.backBtn}>← Retour</Link>

      <div className={styles.layout}>

        <div className={styles.main}>
          <div className={styles.heroImg}>
            {service.images && service.images[0]
              ? <img src={service.images[0]} alt={service.title} />
              : <div className={styles.heroPlaceholder}>{icon}</div>
            }
          </div>

          <span className="badge badge-green" style={{ marginBottom: 10, display: 'inline-block' }}>
            {service.category}
          </span>

          <h1 className={styles.title}>{service.title}</h1>

          <div className={styles.meta}>
            {service.avg_rating && (
              <span>
                ⭐ {service.avg_rating}
                <span style={{ color: '#888' }}> ({service.review_count} avis)</span>
              </span>
            )}
            <span>📍 {service.city}</span>
            <span>🕐 Répond sous 24h</span>
          </div>

          <div className={styles.section}>
            <h2>Description</h2>
            <p>{service.description}</p>
          </div>

          {service.availability && (
            <div className={styles.section}>
              <h2>Disponibilités</h2>
              <p>{service.availability}</p>
            </div>
          )}

          {service.experience && (
            <div className={styles.section}>
              <h2>Expérience</h2>
              <p>{service.experience}</p>
            </div>
          )}

          <div className={styles.section}>
            <h2>Ce que vous obtenez</h2>
            <ul className={styles.includes}>
              <li>✅ Devis gratuit avant intervention</li>
              <li>✅ Prestataire inscrit et vérifié sur ServiceCI</li>
              <li>✅ Contact direct sans intermédiaire</li>
              <li>✅ Paiement convenu directement avec le prestataire</li>
            </ul>
          </div>

          <div className={styles.providerBox}>
            <div className={'avatar avatar-md avatar-placeholder ' + styles.provAvatar}>
              {provider && provider.avatar_url
                ? <img src={provider.avatar_url} alt="" className="avatar avatar-md" />
                : getInitials(provider && provider.full_name)
              }
            </div>
            <div className={styles.provInfo}>
              <div className={styles.provName}>
                {provider && provider.full_name}
                {provider && provider.is_verified && (
                  <span className={styles.verifiedBadge}>✓ Vérifié</span>
                )}
              </div>
              <div className={styles.provBio}>
                {provider && provider.bio ? provider.bio : 'Prestataire inscrit sur ServiceCI'}
              </div>
            </div>
          </div>

          {service.reviews && service.reviews.length > 0 && (
            <div className={styles.section}>
              <h2>Avis clients</h2>
              <div className={styles.reviewList}>
                {service.reviews.slice(0, 5).map(function(review) {
                  return (
                    <div key={review.id} className={styles.review}>
                      <div className={styles.reviewHeader}>
                        <div
                          className="avatar avatar-sm avatar-placeholder"
                          style={{ background: '#1D9E75', color: '#fff', fontSize: 11 }}
                        >
                          {getInitials(review.profiles && review.profiles.full_name)}
                        </div>
                        <strong>
                          {review.profiles && review.profiles.full_name ? review.profiles.full_name : 'Anonyme'}
                        </strong>
                        <span className={styles.reviewRating}>
                          {'⭐'.repeat(review.rating)}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>
                          {new Date(review.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className={styles.reviewComment}>{review.comment}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.bookingBox}>

            <div className={styles.bookingPrice}>
              {service.price.toLocaleString('fr-FR')} FCFA
              <span className={styles.bookingPriceUnit}> / {service.price_unit}</span>
            </div>

            <p style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
              Contactez directement le prestataire pour convenir des détails et du paiement.
            </p>

            {hasWhatsapp && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
                style={{ textDecoration: 'none', marginBottom: 10, display: 'flex' }}
              >
                💬 Contacter sur WhatsApp
              </a>
            )}

            {hasPhone && (
              <a
                href={'tel:' + phoneNumber}
                className="btn btn-outline btn-lg"
                style={{ textDecoration: 'none', display: 'flex' }}
              >
                📞 Appeler
              </a>
            )}

            <div style={{
              marginTop: 20,
              padding: 14,
              background: '#f8f9fa',
              borderRadius: 10,
              fontSize: 12,
              color: '#888',
              lineHeight: 1.6
            }}>
              💡 Convenez du prix, du lieu et de la date directement avec le prestataire avant toute intervention.
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}