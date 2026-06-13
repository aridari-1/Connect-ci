// @ts-nocheck
// =============================================================
// ServiceCI — Paystack Webhook Handler
// supabase/functions/paystack-webhook/index.ts
//
// Deploy: supabase functions deploy paystack-webhook --no-verify-jwt
// =============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Verify Paystack signature ────────────────────────────────
async function verifyPaystackSignature(body, signature, secretKey) {
  const encoder    = new TextEncoder()
  const keyData    = encoder.encode(secretKey)
  const messageData = encoder.encode(body)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const hashArray = Array.from(new Uint8Array(signatureBuffer))
  const computedHash = hashArray.map(function(b) {
    return b.toString(16).padStart(2, '0')
  }).join('')

  return computedHash === signature
}

// ── Verify transaction directly with Paystack API ────────────
async function verifyTransactionWithPaystack(reference, secretKey) {
  const response = await fetch(
    'https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference),
    {
      headers: {
        'Authorization': 'Bearer ' + secretKey,
        'Content-Type': 'application/json',
      },
    }
  )

  const data = await response.json()

  if (!data.status || data.data.status !== 'success') {
    return { success: false, amount: 0, email: '', metadata: {} }
  }

  return {
    success:  true,
    // Paystack returns amount * 100 — divide to get real FCFA
    amount:   Math.round(data.data.amount / 100),
    email:    data.data.customer.email,
    metadata: data.data.metadata || {},
  }
}

// ── Main handler ─────────────────────────────────────────────
Deno.serve(async function(req) {

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const rawBody = await req.text()

  // 1. Verify signature
  const paystackSignature = req.headers.get('x-paystack-signature') || ''
  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY') || ''

  if (!paystackSecretKey) {
    console.error('PAYSTACK_SECRET_KEY is not set')
    return new Response('Server configuration error', { status: 500 })
  }

  const isValid = await verifyPaystackSignature(rawBody, paystackSignature, paystackSecretKey)

  if (!isValid) {
    console.warn('Invalid Paystack signature — possible spoofed request')
    return new Response('Invalid signature', { status: 401 })
  }

  // 2. Parse event
  let event
  try {
    event = JSON.parse(rawBody)
  } catch (e) {
    return new Response('Invalid JSON', { status: 400 })
  }

  const eventType = event.event
  console.log('Paystack event received:', eventType)

  // Only handle successful charges
  if (eventType !== 'charge.success') {
    return new Response('Event ignored', { status: 200 })
  }

  const eventData  = event.data || {}
  const reference  = eventData.reference
  const email      = (eventData.customer || {}).email
  const metadata   = eventData.metadata || {}

  if (!reference || !email) {
    console.error('Missing reference or email in event data')
    return new Response('Bad event data', { status: 400 })
  }

  // 3. Double-verify with Paystack API — never trust webhook payload alone
  const verification = await verifyTransactionWithPaystack(reference, paystackSecretKey)

  if (!verification.success) {
    console.error('Transaction verification failed for reference:', reference)
    return new Response('Transaction not verified', { status: 400 })
  }

  console.log('Transaction verified — Reference:', reference, '— Amount:', verification.amount, 'FCFA')

  // 4. Identify payment type from metadata
  const customFields = (metadata.custom_fields) || []
  const typeField    = customFields.find(function(f) { return f.variable_name === 'type' })
  const paymentType  = (typeField && typeField.value) || 'registration_fee'

  // 5. Supabase admin client — uses auto-injected service role key
  const supabaseUrl        = Deno.env.get('SUPABASE_URL') || ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase           = createClient(supabaseUrl, supabaseServiceKey)

  // ── REGISTRATION FEE ──────────────────────────────────────
  if (paymentType === 'registration_fee') {

    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('Error fetching users:', userError)
      return new Response('Database error', { status: 500 })
    }

    const authUser = userData.users.find(function(u) { return u.email === email })

    if (!authUser) {
      // User hasn't finished signup yet — store as pending
      const { error: pendingError } = await supabase
        .from('pending_payments')
        .upsert({
          email:      email,
          reference:  reference,
          amount:     verification.amount,
          type:       'registration_fee',
          created_at: new Date().toISOString(),
        })

      if (pendingError) {
        console.error('Error storing pending payment:', pendingError)
      }

      console.log('No user found — stored as pending payment for:', email)
      return new Response('Pending payment stored', { status: 200 })
    }

    // Update provider profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_paid:          true,
        registration_ref: reference,
        registered_at:    new Date().toISOString(),
        expires_at:       new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', authUser.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return new Response('Database update error', { status: 500 })
    }

    // Log the payment
    await supabase.from('payment_logs').insert({
      email:      email,
      user_id:    authUser.id,
      reference:  reference,
      amount:     verification.amount,  // stored as real FCFA (500)
      type:       'registration_fee',
      status:     'success',
      created_at: new Date().toISOString(),
    })

    console.log('Registration confirmed for:', email)
    return new Response('Registration confirmed', { status: 200 })
  }

  // ── FEATURED LISTING ──────────────────────────────────────
  if (paymentType === 'featured_listing') {

    const serviceIdField = customFields.find(function(f) {
      return f.variable_name === 'service_id'
    })
    const serviceId = serviceIdField && serviceIdField.value

    if (!serviceId) {
      console.error('Missing service_id for featured_listing payment')
      return new Response('Missing service_id', { status: 400 })
    }

    const { error: featuredError } = await supabase
      .from('services')
      .update({
        is_featured:    true,
        featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        featured_ref:   reference,
      })
      .eq('id', serviceId)

    if (featuredError) {
      console.error('Error setting featured:', featuredError)
      return new Response('Database update error', { status: 500 })
    }

    await supabase.from('payment_logs').insert({
      email:      email,
      reference:  reference,
      amount:     verification.amount,
      type:       'featured_listing',
      service_id: serviceId,
      status:     'success',
      created_at: new Date().toISOString(),
    })

    console.log('Featured listing set for service:', serviceId)
    return new Response('Featured listing confirmed', { status: 200 })
  }

  // Unknown type — return 200 so Paystack does not retry
  console.log('Unknown payment type:', paymentType)
  return new Response('Unknown payment type', { status: 200 })
})