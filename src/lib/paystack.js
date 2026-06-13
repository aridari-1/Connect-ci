/**
 * Paystack payment integration for ServiceCI
 * Docs: https://paystack.com/docs/payments/accept-payments/
 *
 * Paystack charges in the SMALLEST currency unit.
 * For XOF (FCFA), Paystack uses a 0-decimal currency, so amount is sent as-is.
 * For NGN/GHS/KES etc. you multiply by 100 (kobo/pesewas/cents).
 */

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

/**
 * Loads the Paystack inline JS popup script dynamically.
 */
export function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve(window.PaystackPop)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => resolve(window.PaystackPop)
    script.onerror = () => reject(new Error('Failed to load Paystack script'))
    document.head.appendChild(script)
  })
}

/**
 * Initiates a Paystack payment popup.
 *
 * @param {Object} options
 * @param {string} options.email       - Customer email
 * @param {number} options.amount      - Amount in FCFA (XOF, no conversion needed)
 * @param {string} options.name        - Customer name
 * @param {string} options.phone       - Customer phone
 * @param {string} options.ref        - Unique reference string
 * @param {Object} options.metadata   - Extra data (serviceId, providerId, etc.)
 * @param {Function} options.onSuccess - Called with transaction object on success
 * @param {Function} options.onClose   - Called when modal is closed without paying
 * @returns {Promise<void>}
 */
export async function initiatePayment({
  email,
  amount,
  name,
  phone,
  ref,
  metadata = {},
  onSuccess,
  onClose
}) {
  const PaystackPop = await loadPaystackScript()

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount, // XOF is a zero-decimal currency on Paystack — send raw FCFA value
    currency: 'XOF',
    ref: ref || generateRef(),
    firstname: name?.split(' ')[0],
    lastname: name?.split(' ').slice(1).join(' '),
    phone,
    metadata: {
      custom_fields: [
        { display_name: 'Service', variable_name: 'service', value: metadata.serviceTitle || '' },
        { display_name: 'Provider', variable_name: 'provider', value: metadata.providerName || '' },
        { display_name: 'City', variable_name: 'city', value: metadata.city || '' }
      ],
      ...metadata
    },
    channels: ['card', 'mobile_money', 'ussd', 'bank_transfer'],
    callback: (response) => {
      // response.reference is the Paystack transaction reference
      onSuccess && onSuccess(response)
    },
    onClose: () => {
      onClose && onClose()
    }
  })

  handler.openIframe()
}

/**
 * Generates a unique payment reference.
 */
export function generateRef() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `SCI-${timestamp}-${random}`
}

/**
 * Calculates the platform fee (1.5%) on top of the service price.
 */
export function calculateFee(amount) {
  return Math.round(amount * 0.015)
}

/**
 * Returns total (service + fee).
 */
export function calculateTotal(amount) {
  return amount + calculateFee(amount)
}
/**
 * Registration payment — 500 FCFA one-time fee to activate a provider account.
 */
export async function payRegistrationFee({ email, name, phone, onSuccess, onClose }) {
  const PaystackPop = await loadPaystackScript()

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: 500,
    currency: 'XOF',
    ref: generateRef(),
    firstname: name?.split(' ')[0],
    lastname: name?.split(' ').slice(1).join(' '),
    phone,
    metadata: {
      custom_fields: [
        { display_name: 'Type', variable_name: 'type', value: 'registration_fee' }
      ]
    },
    channels: ['card', 'mobile_money', 'ussd', 'bank_transfer'],
    callback: (response) => { onSuccess && onSuccess(response) },
    onClose: () => { onClose && onClose() }
  })

  handler.openIframe()
}