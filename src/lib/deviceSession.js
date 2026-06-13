// =============================================================
// src/lib/deviceSession.js
// Tracks and limits concurrent device sessions per user.
// Max 2 devices at the same time.
// =============================================================

import { supabase } from './supabase'

var DEVICE_TOKEN_KEY = 'connect_ci_device_token'

/**
 * Get or create a unique token for this browser/device.
 * Stored in localStorage so it persists across page reloads.
 */
function getDeviceToken() {
  try {
    var existing = localStorage.getItem(DEVICE_TOKEN_KEY)
    if (existing) return existing
    var token = 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10)
    localStorage.setItem(DEVICE_TOKEN_KEY, token)
    return token
  } catch (e) {
    // localStorage unavailable (private mode etc.) — generate ephemeral token
    return 'dev-ephemeral-' + Date.now()
  }
}

/**
 * Register this device for the logged-in user.
 * If they already have 2 other devices registered, block access.
 *
 * Returns { allowed: true } or { allowed: false, message: '...' }
 */
export async function registerDevice(userId) {
  if (!userId) return { allowed: true }

  var deviceToken = getDeviceToken()
  var userAgent   = (navigator.userAgent || '').substring(0, 200)

  try {
    // Check if this exact device is already registered for this user
    var existingRes = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('device_token', deviceToken)
      .maybeSingle()

    if (existingRes.data) {
      // Device already registered — just refresh last_seen
      await supabase
        .from('user_sessions')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', existingRes.data.id)
      return { allowed: true }
    }

    // Count how many devices this user already has
    var countRes = await supabase
      .from('user_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    var deviceCount = countRes.count || 0

    if (deviceCount >= 2) {
      return {
        allowed: false,
        message: 'Votre compte est deja connecte sur 2 appareils. Deconnectez-vous sur un autre appareil pour continuer.'
      }
    }

    // Register this new device
    await supabase.from('user_sessions').insert({
      user_id:      userId,
      device_token: deviceToken,
      user_agent:   userAgent,
      last_seen:    new Date().toISOString(),
    })

    return { allowed: true }

  } catch (err) {
    // If sessions check fails for any reason, allow the user in
    // (fail open — better than locking users out due to a DB hiccup)
    console.error('registerDevice error:', err)
    return { allowed: true }
  }
}

/**
 * Remove this device from the sessions table on logout.
 */
export async function unregisterDevice(userId) {
  if (!userId) return
  var deviceToken = getDeviceToken()
  try {
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('device_token', deviceToken)
  } catch (err) {
    console.error('unregisterDevice error:', err)
  }
}

/**
 * Get all active sessions for a user.
 * Used in the profile page to show connected devices.
 */
export async function getUserSessions(userId) {
  if (!userId) return []
  try {
    var res = await supabase
      .from('user_sessions')
      .select('id, user_agent, last_seen, created_at')
      .eq('user_id', userId)
      .order('last_seen', { ascending: false })
    return res.data || []
  } catch (err) {
    console.error('getUserSessions error:', err)
    return []
  }
}

/**
 * Force-logout all OTHER devices (not this one).
 * Called from profile settings.
 */
export async function logoutOtherDevices(userId) {
  if (!userId) return
  var deviceToken = getDeviceToken()
  try {
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .neq('device_token', deviceToken)
  } catch (err) {
    console.error('logoutOtherDevices error:', err)
  }
}

/**
 * Parse a user agent string into a human-readable device name.
 * e.g. "Mozilla/5.0 (iPhone; CPU..." → "iPhone"
 */
export function parseUserAgent(ua) {
  if (!ua) return 'Appareil inconnu'
  if (ua.includes('iPhone'))    return 'iPhone'
  if (ua.includes('iPad'))      return 'iPad'
  if (ua.includes('Android'))   return 'Android'
  if (ua.includes('Windows'))   return 'Windows'
  if (ua.includes('Macintosh')) return 'Mac'
  if (ua.includes('Linux'))     return 'Linux'
  return 'Navigateur web'
}