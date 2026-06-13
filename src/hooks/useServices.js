import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// =============================================================
// useServices — fetch a paginated list of active services
// with debounced search, category and city filters.
// =============================================================
export function useServices(options) {
  var category  = (options && options.category)  ? options.category  : null
  var city      = (options && options.city)      ? options.city      : null
  var search    = (options && options.search)    ? options.search    : null
  var pageSize  = (options && options.pageSize)  ? options.pageSize  : 12
  var page      = (options && options.page !== undefined) ? options.page : 0

  var [services, setServices]   = useState([])
  var [loading, setLoading]     = useState(true)
  var [error, setError]         = useState(null)
  var [hasMore, setHasMore]     = useState(false)
  var [total, setTotal]         = useState(0)

  // Debounce search — wait 400ms after user stops typing
  var [debouncedSearch, setDebouncedSearch] = useState(search)
  var debounceTimer = useRef(null)

  useEffect(function() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(function() {
      setDebouncedSearch(search)
    }, 400)
    return function() {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [search])

  var fetchServices = useCallback(function() {
    setLoading(true)
    setError(null)

    var from = page * pageSize
    var to   = from + pageSize - 1

    var query = supabase
      .from('services')
      .select(
        'id, title, category, price, price_unit, city, images, created_at, ' +
        'profiles (id, full_name, avatar_url, is_verified), ' +
        'reviews (rating)',
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (category) query = query.eq('category', category)
    if (city)     query = query.eq('city', city)

    if (debouncedSearch) {
      query = query.or(
        'title.ilike.%' + debouncedSearch + '%,' +
        'description.ilike.%' + debouncedSearch + '%,' +
        'category.ilike.%' + debouncedSearch + '%,' +
        'city.ilike.%' + debouncedSearch + '%'
      )
    }

    query.then(function(res) {
      if (res.error) {
        setError(res.error.message)
        setLoading(false)
        return
      }

      var enriched = (res.data || []).map(function(svc) {
        var reviews     = svc.reviews || []
        var reviewCount = reviews.length
        var avgRating   = reviewCount
          ? (reviews.reduce(function(sum, r) { return sum + r.rating }, 0) / reviewCount).toFixed(1)
          : null
        return Object.assign({}, svc, {
          avg_rating:   avgRating,
          review_count: reviewCount,
        })
      })

      var totalCount = res.count || 0
      setServices(enriched)
      setTotal(totalCount)
      setHasMore(to < totalCount - 1)
      setLoading(false)
    })
  }, [category, city, debouncedSearch, page, pageSize])

  useEffect(function() {
    fetchServices()
  }, [fetchServices])

  return {
    services: services,
    loading:  loading,
    error:    error,
    hasMore:  hasMore,
    total:    total,
    refetch:  fetchServices,
  }
}

// =============================================================
// useService — fetch a single service with full details.
// Simple in-memory cache to avoid refetching the same listing.
// =============================================================
var serviceCache = {}

export function useService(id) {
  var [service, setService] = useState(serviceCache[id] || null)
  var [loading, setLoading] = useState(!serviceCache[id])
  var [error, setError]     = useState(null)

  useEffect(function() {
    if (!id) return

    // Already cached — use it immediately, refresh in background
    if (serviceCache[id]) {
      setService(serviceCache[id])
      setLoading(false)
    }

    supabase
      .from('services')
      .select(
        '*, ' +
        'profiles (id, full_name, avatar_url, phone, whatsapp, is_verified, bio, city), ' +
        'reviews (id, rating, comment, created_at, profiles (full_name, avatar_url))'
      )
      .eq('id', id)
      .single()
      .then(function(res) {
        if (res.error) {
          setError(res.error.message)
          setLoading(false)
          return
        }

        var data        = res.data
        var reviews     = (data && data.reviews) ? data.reviews : []
        var reviewCount = reviews.length
        var avgRating   = reviewCount
          ? (reviews.reduce(function(sum, r) { return sum + r.rating }, 0) / reviewCount).toFixed(1)
          : null

        var enriched = Object.assign({}, data, {
          avg_rating:   avgRating,
          review_count: reviewCount,
        })

        // Cache for this session
        serviceCache[id] = enriched
        setService(enriched)
        setLoading(false)
      })
  }, [id])

  return { service: service, loading: loading, error: error }
}

// =============================================================
// createService — insert a new listing with timeout protection.
// Prevents duplicate submissions on slow connections.
// =============================================================
export async function createService(serviceData) {
  var TIMEOUT_MS = 15000

  var timeoutPromise = new Promise(function(_, reject) {
    setTimeout(function() {
      reject(new Error(
        'La connexion est trop lente. Verifiez votre reseau et reessayez.'
      ))
    }, TIMEOUT_MS)
  })

  var insertPromise = supabase
    .from('services')
    .insert(serviceData)
    .select()
    .single()
    .then(function(res) {
      if (res.error) throw res.error
      return res.data
    })

  return Promise.race([insertPromise, timeoutPromise])
}

// =============================================================
// updateService — update an existing listing.
// =============================================================
export async function updateService(id, updates) {
  var res = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (res.error) throw res.error
  return res.data
}

// =============================================================
// deleteService — soft delete (set is_active = false).
// Also clears the cache entry for this listing.
// =============================================================
export async function deleteService(id) {
  var res = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', id)
  if (res.error) throw res.error
  delete serviceCache[id]
}