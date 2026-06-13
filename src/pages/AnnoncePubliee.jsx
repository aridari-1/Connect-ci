import { Link } from 'react-router-dom'
import styles from './BookingSuccess.module.css'

export default function AnnoncePubliee() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>📋</div>
        <h1 className={styles.title}>Annonce envoyee !</h1>
        <p className={styles.sub}>
          Votre annonce a bien ete recue. Notre equipe va la verifier
          et la mettre en ligne sous <strong>24 heures</strong>.
          Vous serez contacte par WhatsApp des que c'est en ligne.
        </p>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span>Etape 1</span>
            <strong>Annonce soumise ✅</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Etape 2</span>
            <strong>Verification en cours ⏳</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Etape 3</span>
            <strong>Mise en ligne sous 24h</strong>
          </div>
        </div>

        <div className={styles.notice}>
          💬 Une question ? Contactez-nous sur WhatsApp :
          <strong> +225 XX XX XX XX</strong>
        </div>

        <Link to="/" className="btn btn-primary btn-lg">
          Retour a l'accueil
        </Link>
      </div>
    </div>
  )
}