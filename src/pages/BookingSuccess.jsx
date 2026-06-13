import { useLocation, Link } from 'react-router-dom'
import styles from './BookingSuccess.module.css'

export default function BookingSuccess() {
  const { state } = useLocation()

  if (!state) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <p>Réservation introuvable. <Link to="/">Retour à l'accueil</Link></p>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>✅</div>
        <h1 className={styles.title}>Paiement réussi !</h1>
        <p className={styles.sub}>
          Votre réservation est confirmée. Le prestataire vous contactera sous peu via WhatsApp.
        </p>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span>Service</span>
            <strong>{state.service}</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Prestataire</span>
            <strong>{state.provider}</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Ville</span>
            <strong>{state.city}</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Montant payé</span>
            <strong>{state.amount?.toLocaleString('fr-FR')} FCFA</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Référence Paystack</span>
            <strong className={styles.ref}>{state.ref}</strong>
          </div>
        </div>

        <div className={styles.notice}>
          💬 Gardez votre référence de paiement en cas de litige. Notre équipe de support est disponible
          sur WhatsApp : <strong>+225 XX XX XX XX</strong>
        </div>

        <Link to="/bookings" className="btn btn-primary btn-lg" style={{ marginBottom: 12 }}>
          Voir mes réservations
        </Link>
        <Link to="/" className="btn btn-outline btn-lg">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
