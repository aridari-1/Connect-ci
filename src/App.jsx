import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ServiceDetail from './pages/ServiceDetail'
import { LoginPage, SignupPage } from './pages/Auth'
import PostService from './pages/PostService'
import BookingSuccess from './pages/BookingSuccess'
import Profile from './pages/Profile'
import Search from './pages/Search'
import AnnoncePubliee from './pages/AnnoncePubliee'
import './styles/global.css'

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 16px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Page introuvable</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>Cette page n'existe pas ou a été déplacée.</p>
      <a href="/" className="btn btn-primary">Retour à l'accueil</a>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/service/:id" element={<ServiceDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/post-service" element={<PostService />} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/bookings" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/search" element={<Search />} />
<Route path="/annonce-publiee" element={<AnnoncePubliee />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
