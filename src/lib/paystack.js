// =============================================================
// ServiceCI — Paystack Frontend Integration
// src/lib/paystack.js
// =============================================================

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

/**
 * Convert FCFA amount to Paystack format.
 * Paystack requires amount * 100 even for XOF (FCFA).
 * Examples:
 *   500 FCFA  → 50000
 *   1500 FCFA → 150000
 *   15000 FCFA → 1500000
 */
export function toPaystackAmount(fcfa) {
  return fcfa * 100
}

/**
 * Load Paystack inline JS script dynamically.
 */
export function loadPaystackScript() {
  return new Promise(function(resolve, reject) {
    if (window.PaystackPop) {
      resolve(window.PaystackPop)
      return
    }
    var script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = function() { resolve(window.PaystackPop) }
    script.onerror = function() { reject(new Error('Failed to load Paystack script')) }
    document.head.appendChild(script)
  })
}

/**
 * Generate a unique payment reference.
 * Format: SCI-{timestamp}-{random}
 */
export function generateRef() {
  var timestamp = Date.now()
  var random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return 'SCI-' + timestamp + '-' + random
}

/**
 * Calculate platform fee (1.5%) on top of service price.
 */
export function calculateFee(amount) {
  return Math.round(amount * 0.015)
}

/**
 * Calculate total (service price + fee).
 */
export function calculateTotal(amount) {
  return amount + calculateFee(amount)
}

// =============================================================
// REGISTRATION FEE — 500 FCFA
// Called during provider signup.
// Webhook receives type = 'registration_fee'
// =============================================================
export async function payRegistrationFee(params) {
  var email     = params.email
  var name      = params.name || ''
  var phone     = params.phone || ''
  var onSuccess = params.onSuccess
  var onClose   = params.onClose

  var PaystackPop = await loadPaystackScript()

  var handler = PaystackPop.setup({
    key:      PAYSTACK_PUBLIC_KEY,
    email:    email,
    amount:   toPaystackAmount(500),  // 500 FCFA → 50000
    currency: 'XOF',
    ref:      generateRef(),
    firstname: name.split(' ')[0] || '',
    lastname:  name.split(' ').slice(1).join(' ') || '',
    phone:    phone,

    metadata: {
      custom_fields: [
        {
          display_name:  'Type de paiement',
          variable_name: 'type',
          value:         'registration_fee',
        },
        {
          display_name:  'Prestataire',
          variable_name: 'provider_name',
          value:         name,
        },
      ],
    },

    channels: ['card', 'mobile_money', 'ussd', 'bank_transfer'],

    callback: function(response) {
      if (onSuccess) onSuccess(response)
    },

    onClose: function() {
      if (onClose) onClose()
    },
  })

  handler.openIframe()
}

// =============================================================
// FEATURED LISTING PAYMENT — 1500 FCFA / 30 days
// Called from the provider profile to boost a listing.
// Webhook receives type = 'featured_listing'
// =============================================================
export async function payFeaturedListing(params) {
  var email        = params.email
  var name         = params.name || ''
  var serviceId    = params.serviceId
  var serviceTitle = params.serviceTitle || ''
  var onSuccess    = params.onSuccess
  var onClose      = params.onClose

  if (!serviceId) {
    throw new Error('serviceId is required for featured listing payment')
  }

  var PaystackPop = await loadPaystackScript()

  var handler = PaystackPop.setup({
    key:      PAYSTACK_PUBLIC_KEY,
    email:    email,
    amount:   toPaystackAmount(1500),  // 1500 FCFA → 150000
    currency: 'XOF',
    ref:      generateRef(),
    firstname: name.split(' ')[0] || '',
    lastname:  name.split(' ').slice(1).join(' ') || '',

    metadata: {
      custom_fields: [
        {
          display_name:  'Type de paiement',
          variable_name: 'type',
          value:         'featured_listing',
        },
        {
          display_name:  'ID Annonce',
          variable_name: 'service_id',
          value:         serviceId,
        },
        {
          display_name:  'Annonce',
          variable_name: 'service_title',
          value:         serviceTitle,
        },
      ],
    },

    channels: ['card', 'mobile_money', 'ussd', 'bank_transfer'],

    callback: function(response) {
      if (onSuccess) onSuccess(response)
    },

    onClose: function() {
      if (onClose) onClose()
    },
  })

  handler.openIframe()
}

// =============================================================
// GENERAL PAYMENT — for future use (service booking etc.)
// =============================================================
export async function initiatePayment(params) {
  var email     = params.email
  var amount    = params.amount       // pass raw FCFA — converted inside
  var name      = params.name || ''
  var phone     = params.phone || ''
  var ref       = params.ref || generateRef()
  var metadata  = params.metadata || {}
  var onSuccess = params.onSuccess
  var onClose   = params.onClose

  var PaystackPop = await loadPaystackScript()

  var handler = PaystackPop.setup({
    key:      PAYSTACK_PUBLIC_KEY,
    email:    email,
    amount:   toPaystackAmount(amount),
    currency: 'XOF',
    ref:      ref,
    firstname: name.split(' ')[0] || '',
    lastname:  name.split(' ').slice(1).join(' ') || '',
    phone:    phone,

    metadata: {
      custom_fields: [
        {
          display_name:  'Service',
          variable_name: 'service',
          value:         metadata.serviceTitle || '',
        },
        {
          display_name:  'Prestataire',
          variable_name: 'provider',
          value:         metadata.providerName || '',
        },
        {
          display_name:  'Ville',
          variable_name: 'city',
          value:         metadata.city || '',
        },
      ],
    },

    channels: ['card', 'mobile_money', 'ussd', 'bank_transfer'],

    callback: function(response) {
      if (onSuccess) onSuccess(response)
    },

    onClose: function() {
      if (onClose) onClose()
    },
  })

  handler.openIframe()
}