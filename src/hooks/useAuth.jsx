import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { registerDevice, unregisterDevice } from '../lib/deviceSession'

var AuthContext = createContext(null)

export function AuthProvider({ children }) {
  var [user, setUser]       = useState(null)
  var [profile, setProfile] = useState(null)
  var [loading, setLoading] = useState(true)

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      var session = res.data.session
      if (session && session.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    var listener = supabase.auth.onAuthStateChange(function(_event, session) {
      if (session && session.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return function() {
      listener.data.subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    var res = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (res.data) setProfile(res.data)
    setLoading(false)
  }

  // ── Sign up ──────────────────────────────────────────────
  // Provider pays 500 FCFA first (via Paystack), then this is called.
  async function signUp({ email, password, fullName, phone, city, paystackRef }) {
    var res = await supabase.auth.signUp({
      email:    email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          phone:     phone,
          city:      city,
        }
      }
    })
    if (res.error) throw res.error

    // Wait for the handle_new_user trigger to create the profile row
    if (res.data.user && paystackRef) {
      await new Promise(function(resolve) { setTimeout(resolve, 1500) })
      await supabase
        .from('profiles')
        .update({
          registration_ref: paystackRef,
          is_paid:          true,
        })
        .eq('id', res.data.user.id)
    }

    return res.data
  }

  // ── Sign in ──────────────────────────────────────────────
  async function signIn({ email, password }) {
    var res = await supabase.auth.signInWithPassword({
      email:    email,
      password: password,
    })
    if (res.error) throw res.error

    // Check device limit — max 2 devices per account
    var check = await registerDevice(res.data.user.id)
    if (!check.allowed) {
      // Sign the user back out immediately
      await supabase.auth.signOut()
      throw new Error(check.message)
    }

    return res.data
  }

  // ── Sign out ─────────────────────────────────────────────
  async function signOut() {
    if (user) {
      await unregisterDevice(user.id)
    }
    var res = await supabase.auth.signOut()
    if (res.error) throw res.error
  }

  // ── Update profile ───────────────────────────────────────
  async function updateProfile(updates) {
    if (!user) throw new Error('Non authentifie')
    var res = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (res.error) throw res.error
    setProfile(res.data)
    return res.data
  }

  var value = {
    user:          user,
    profile:       profile,
    loading:       loading,
    signUp:        signUp,
    signIn:        signIn,
    signOut:       signOut,
    updateProfile: updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  var ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}