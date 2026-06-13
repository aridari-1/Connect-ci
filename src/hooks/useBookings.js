import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ── useBookings — fetch bookings for a user (client or provider) ──
// Not used in the current announce-only version.
// Keep this file for when the booking/payment flow is re-enabled.
export function useBookings(userId, role) {
  var resolvedRole = role || 'client'

  var [bookings, setBookings] = useState([])
  var [loading, setLoading]   = useState(true)
  var [error, setError]       = useState(null)

  useEffect(function() {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    var field = resolvedRole === 'client' ? 'client_id' : 'provider_id'

    supabase
      .from('bookings')
      .select(
        '*, ' +
        'services (id, title, category, price, price_unit, city), ' +
        'client:profiles!bookings_client_id_fkey (full_name, avatar_url, phone), ' +
        'provider:profiles!bookings_provider_id_fkey (full_name, avatar_url, phone)'
      )
      .eq(field, userId)
      .order('created_at', { ascending: false })
      .then(function(res) {
        if (res.error) {
          setError(res.error.message)
        } else {
          setBookings(res.data || [])
        }
        setLoading(false)
      })
  }, [userId, resolvedRole])

  return { bookings: bookings, loading: loading, error: error }
}

// ── createBooking — save a booking after successful Paystack payment ──
export async function createBooking(params) {
  var serviceId     = params.serviceId
  var clientId      = params.clientId
  var providerId    = params.providerId
  var amount        = params.amount
  var paystackRef   = params.paystackRef
  var paymentMethod = params.paymentMethod || 'paystack'
  var notes         = params.notes || ''

  var res = await supabase
    .from('bookings')
    .insert({
      service_id:         serviceId,
      client_id:          clientId,
      provider_id:        providerId,
      amount:             amount,
      paystack_reference: paystackRef,
      payment_method:     paymentMethod,
      status:             'paid',
      notes:              notes,
    })
    .select()
    .single()

  if (res.error) throw res.error
  return res.data
}

// ── updateBookingStatus — provider confirms, completes, or cancels ──
export async function updateBookingStatus(bookingId, status) {
  var res = await supabase
    .from('bookings')
    .update({
      status:     status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single()

  if (res.error) throw res.error
  return res.data
}