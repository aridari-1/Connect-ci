# ServiceCI 🇨🇮

**Marketplace de services pour la Côte d'Ivoire**  
Connecte prestataires et clients avec paiement sécurisé via Paystack.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Base de données | Supabase (PostgreSQL) |
| Authentification | Supabase Auth |
| Stockage fichiers | Supabase Storage |
| Paiement | Paystack (XOF — FCFA) |
| Styles | CSS Modules |

---

## Démarrage rapide

### 1. Prérequis

- Node.js 18+
- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [Paystack](https://paystack.com) (gratuit, avec accès Côte d'Ivoire)

### 2. Installation

```bash
# Cloner / décompresser le projet, puis :
cd serviceci
npm install
```

### 3. Configuration Supabase

1. Créez un projet sur https://supabase.com
2. Allez dans **SQL Editor** et exécutez dans l'ordre :
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage.sql`
3. Récupérez vos clés dans **Settings → API** :
   - `Project URL`
   - `anon / public key`

### 4. Configuration Paystack

1. Créez un compte sur https://paystack.com
2. Allez dans **Settings → Developer** pour récupérer votre clé publique
3. Pour les tests, utilisez la clé `pk_test_...`
4. Pour la production, activez votre compte et utilisez `pk_live_...`

> **Note Paystack XOF :** Paystack supporte le FCFA (XOF). Assurez-vous que votre compte Paystack est activé pour la Côte d'Ivoire. Contactez support@paystack.com si nécessaire.

### 5. Variables d'environnement

```bash
# Copiez le template
cp .env.example .env.local

# Remplissez vos clés dans .env.local :
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
VITE_PAYSTACK_PUBLIC_KEY=pk_test_votre_cle
```

### 6. Lancer en développement

```bash
npm run dev
# → http://localhost:3000
```

---

## Structure du projet

```
serviceci/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx            # Barre de navigation
│   │   ├── Navbar.module.css
│   │   ├── ServiceCard.jsx       # Carte d'un service
│   │   └── ServiceCard.module.css
│   ├── hooks/
│   │   ├── useAuth.jsx           # Contexte d'authentification Supabase
│   │   ├── useServices.js        # Récupération/création de services
│   │   └── useBookings.js        # Gestion des réservations
│   ├── lib/
│   │   ├── supabase.js           # Client Supabase
│   │   └── paystack.js           # Intégration Paystack
│   ├── pages/
│   │   ├── Home.jsx              # Page d'accueil
│   │   ├── ServiceDetail.jsx     # Détail d'un service + paiement
│   │   ├── Auth.jsx              # Connexion & inscription
│   │   ├── PostService.jsx       # Publier un service
│   │   ├── BookingSuccess.jsx    # Page de confirmation
│   │   └── Profile.jsx           # Profil & réservations
│   ├── styles/
│   │   └── global.css            # Styles globaux & utilitaires
│   ├── App.jsx                   # Routeur principal
│   └── main.jsx                  # Point d'entrée
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # Tables + RLS
│       └── 002_storage.sql         # Buckets d'images
├── .env.example                  # Template des variables d'env
├── index.html
├── package.json
└── vite.config.js
```

---

## Fonctionnalités

### Pour les clients
- ✅ Parcourir les services par catégorie et ville
- ✅ Recherche textuelle
- ✅ Voir le profil du prestataire
- ✅ Payer via Paystack (carte bancaire, MTN MoMo, Orange Money, Wave)
- ✅ Historique des réservations
- ✅ Contacter le prestataire via WhatsApp

### Pour les prestataires
- ✅ Créer un compte et publier un service
- ✅ Définir prix, catégorie, ville, disponibilités
- ✅ Recevoir les paiements via Paystack
- ✅ Voir les réservations entrantes

### Sécurité
- ✅ Row Level Security (RLS) sur toutes les tables Supabase
- ✅ Paiements traités par Paystack (PCI-DSS compliant)
- ✅ Authentification JWT via Supabase Auth

---

## Déploiement en production

### Build

```bash
npm run build
# → dossier dist/
```

### Hébergement recommandé
- **Vercel** (gratuit) : connectez votre repo GitHub, ajoutez les variables d'env
- **Netlify** (gratuit) : drag & drop du dossier `dist/`

### Checklist production
- [ ] Remplacer `pk_test_...` par `pk_live_...` dans les variables d'env
- [ ] Activer les emails de confirmation dans Supabase Auth
- [ ] Configurer un domaine personnalisé
- [ ] Activer le webhook Paystack pour confirmer les paiements côté serveur
- [ ] Configurer les notifications WhatsApp (Twilio ou Meta Business API)

---

## Webhook Paystack (recommandé en production)

Pour une sécurité maximale, vérifiez les paiements côté serveur via le webhook Paystack.

1. Dans votre dashboard Paystack → **Settings → API Keys & Webhooks**
2. Ajoutez votre URL : `https://votre-domaine.com/api/paystack-webhook`
3. Créez une Edge Function Supabase pour traiter le webhook :

```javascript
// supabase/functions/paystack-webhook/index.ts
import { createClient } from '@supabase/supabase-js'
import { crypto } from 'https://deno.land/std/crypto/mod.ts'

Deno.serve(async (req) => {
  const signature = req.headers.get('x-paystack-signature')
  const body = await req.text()

  // Vérifier la signature
  const hash = await crypto.subtle.digest(
    'SHA-512',
    new TextEncoder().encode(Deno.env.get('PAYSTACK_SECRET_KEY') + body)
  )
  // ... comparer hash et signature, puis mettre à jour la réservation
})
```

---

## Personnalisation facile

| Quoi modifier | Fichier |
|---------------|---------|
| Couleurs & thème | `src/styles/global.css` (variables CSS) |
| Catégories | `src/pages/Home.jsx` (array CATEGORIES) |
| Villes | `src/pages/Home.jsx` (array CITIES) |
| Commission plateforme | `src/lib/paystack.js` (fonction `calculateFee`) |
| Textes & langue | Chercher le texte dans les fichiers `.jsx` |

---

## Support

Pour toute question, ouvrez une issue ou contactez l'équipe.
