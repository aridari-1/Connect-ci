import { lazy, Suspense, Component } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/Navbar'

// =============================================================
// Lazy load all pages — only the current page is downloaded.
// Cuts initial bundle size by ~60%.
// =============================================================
var Home          = lazy(function() { return import('./pages/Home') })
var ServiceDetail = lazy(function() { return import('./pages/ServiceDetail') })
var PostService   = lazy(function() { return import('./pages/PostService') })
var Search        = lazy(function() { return import('./pages/Search') })
var Profile       = lazy(function() { return import('./pages/Profile') })
var BookingSuccess = lazy(function() { return import('./pages/BookingSuccess') })
var AnnoncePubliee = lazy(function() { return import('./pages/AnnoncePubliee') })

// Auth pages — kept together since they're small
var Auth = lazy(function() { return import('./pages/Auth') })

import './styles/global.css'

// =============================================================
// Loading spinner — shown while a lazy page is downloading.
// =============================================================
function PageLoader() {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      'calc(100vh - 58px)',
      flexDirection:  'column',
      gap:            16,
    }}>
      <div style={{
        width:        40,
        height:       40,
        border:       '3px solid #E1F5EE',
        borderTop:    '3px solid #1D9E75',
        borderRadius: '50%',
        animation:    'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// =============================================================
// Error Boundary — catches any crash and shows a recovery screen
// instead of a blank white page.
// =============================================================
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message || 'Erreur inconnue' }
  }

  componentDidCatch(error, info) {
    console.error('App error caught by boundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          minHeight:      '100vh',
          padding:        '40px 20px',
          textAlign:      'center',
          fontFamily:     'system-ui, sans-serif',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>
            Une erreur est survenue
          </h2>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 24, maxWidth: 320, lineHeight: 1.6 }}>
            Quelque chose ne s'est pas passe comme prevu. Rechargez la page — vos donnees sont sauvegardees.
          </p>
          <button
            onClick={function() { window.location.reload() }}
            style={{
              background:   '#1D9E75',
              color:        '#fff',
              border:       'none',
              borderRadius: 10,
              padding:      '12px 28px',
              fontSize:     15,
              fontWeight:   600,
              cursor:       'pointer',
              marginBottom: 12,
            }}
          >
            Recharger la page
          </button>
          <button
            onClick={function() { window.location.href = '/' }}
            style={{
              background:   'transparent',
              color:        '#888',
              border:       '1px solid #ddd',
              borderRadius: 10,
              padding:      '10px 24px',
              fontSize:     14,
              cursor:       'pointer',
            }}
          >
            Retour a l'accueil
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// =============================================================
// 404 page
// =============================================================
function NotFound() {
  return (
    <div style={{
      textAlign:      'center',
      padding:        '80px 20px',
      fontFamily:     'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1a1a1a' }}>
        Page introuvable
      </h1>
      <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
        Cette page n'existe pas ou a ete deplacee.
      </p>
      <a
        href="/"
        style={{
          display:      'inline-block',
          background:   '#1D9E75',
          color:        '#fff',
          padding:      '12px 28px',
          borderRadius: 10,
          fontSize:     14,
          fontWeight:   600,
          textDecoration: 'none',
        }}
      >
        Retour a l'accueil
      </a>
    </div>
  )
}

// =============================================================
// Main App
// =============================================================
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <main>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"                  element={<Home />} />
                <Route path="/search"            element={<Search />} />
                <Route path="/service/:id"       element={<ServiceDetail />} />
                <Route path="/post-service"      element={<PostService />} />
                <Route path="/booking-success"   element={<BookingSuccess />} />
                <Route path="/annonce-publiee"   element={<AnnoncePubliee />} />
                <Route path="/profile"           element={<Profile />} />
                <Route path="/bookings"          element={<Profile />} />
                <Route path="/login"             element={<AuthPage type="login" />} />
                <Route path="/signup"            element={<AuthPage type="signup" />} />
                <Route path="*"                  element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

// Wrapper to handle the named exports from Auth.jsx
function AuthPage({ type }) {
  var [AuthModule, setAuthModule] = useState(null)

  useEffect(function() {
    import('./pages/Auth').then(function(mod) {
      setAuthModule(mod)
    })
  }, [])

  if (!AuthModule) return <PageLoader />
  if (type === 'login')  return <AuthModule.LoginPage />
  if (type === 'signup') return <AuthModule.SignupPage />
  return <NotFound />
}

// useState and useEffect needed for AuthPage
import { useState, useEffect } from 'react'