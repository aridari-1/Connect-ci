import { Link } from 'react-router-dom'
import styles from './ServiceCard.module.css'

const CATEGORY_ICONS = {
  'Plomberie':                              '🔧',
  'Electricite':                            '⚡',
  'Coiffure Femme':                         '💇',
  'Coiffure Homme':                         '💈',
  'Jardinage':                              '🌿',
  'Menage':                                 '🏠',
  'Transport & Livraison':                  '🚛',
  'Cuisine a domicile / Traiteur':          '👨‍🍳',
  'Reparation telephones & electronique':   '📱',
  'Construction':                           '🏗️',
  'Beaute & Bien-etre':                     '✨',
  'Cours particuliers':                     '📚',
  'Securite':                               '🛡️',
  'Climatisation & Froid':                  '❄️',
  'Couture & Retouches':                    '🧵',
  'Photographe & Videaste':                 '📷',
  'Demenagement':                           '📦',
  'Mecanicien':                             '🔩',
  'Menuisier':                              '🪚',
  'Cordonnier':                             '👟',
  'Vidange fosse septique':                 '🚰',
  'Chauffeur':                              '🚗',
  'Wedding Planner':                      '💍',
  'Peintre':                              '🖌️',
  'Staffeur':                             '🪣',
}

export default function ServiceCard({ service }) {
  var icon = CATEGORY_ICONS[service.category] || '🔨'

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(function(n) { return n[0] }).join('').toUpperCase().slice(0, 2)
  }

  var hasImage   = service.images && service.images[0]
  var profiles   = service.profiles || {}
  var hasAvatar  = profiles.avatar_url
  var provName   = profiles.full_name || 'Prestataire'
  var isVerified = profiles.is_verified

  var href = '/service/' + service.id

  return (
    <Link to={href} className={styles.card}>

      {/* Image / icon */}
      <div className={styles.imgBox}>
        {hasImage
          ? <img src={service.images[0]} alt={service.title} className={styles.img} />
          : <div className={styles.iconPlaceholder}>{icon}</div>
        }
        <span className={'badge badge-green ' + styles.catBadge}>
          {service.category}
        </span>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.title}>{service.title}</div>

        {/* Provider row */}
        <div className={styles.providerRow}>
          <div className={'avatar avatar-sm avatar-placeholder ' + styles.avatar}>
            {hasAvatar
              ? <img src={profiles.avatar_url} alt="" className="avatar avatar-sm" />
              : getInitials(profiles.full_name)
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <span className={styles.providerName}>{provName}</span>
            {isVerified && (
              <span className={styles.verified} title="Verifie"> ✓</span>
            )}
          </div>
          <span className={styles.city}>📍 {service.city}</span>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.price}>
            {service.price.toLocaleString('fr-FR')} FCFA
            <span className={styles.priceUnit}> / {service.price_unit}</span>
          </div>
          {service.avg_rating && (
            <div className={styles.rating}>
              ⭐ {service.avg_rating}
              <span className={styles.reviewCount}> ({service.review_count})</span>
            </div>
          )}
        </div>
      </div>

    </Link>
  )
}