import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── useServices — fetch a list of active services with filters ──
export function useServices(options) {
  var category = (options && options.category) ? options.category : null
  var city     = (options && options.city)     ? options.city     : null
  var search   = (options && options.search)   ? options.search   : null
  var limit    = (options && options.limit)    ? options.limit    : 20

  var [services, setServices] = useState([])
  var [loading, setLoading]   = useState(true)
  var [error, setError]       = useState(null)

  var fetchServices = useCallback(function() {
    setLoading(true)
    setError(null)

    var query = supabase
      .from('services')
      .select(
        'id, title, category, price, price_unit, city, images, created_at, ' +
        'profiles (id, full_name, avatar_url, is_verified), ' +
        'reviews (rating)'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category) query = query.eq('category', category)
    if (city)     query = query.eq('city', city)

    // Search across title, description, category and city
    if (search) {
      query = query.or(
        'title.ilike.%' + search + '%,' +
        'description.ilike.%' + search + '%,' +
        'category.ilike.%' + search + '%,' +
        'city.ilike.%' + search + '%'
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

      setServices(enriched)
      setLoading(false)
    })
  }, [category, city, search, limit])

  useEffect(function() {
    fetchServices()
  }, [fetchServices])

  return { services: services, loading: loading, error: error, refetch: fetchServices }
}

// ── useService — fetch a single service with full details ──
export function useService(id) {
  var [service, setService] = useState(null)
  var [loading, setLoading] = useState(true)
  var [error, setError]     = useState(null)

  useEffect(function() {
    if (!id) return
    setLoading(true)
    setError(null)

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

        setService(Object.assign({}, data, {
          avg_rating:   avgRating,
          review_count: reviewCount,
        }))
        setLoading(false)
      })
  }, [id])

  return { service: service, loading: loading, error: error }
}

// ── createService — insert a new listing ──
export async function createService(serviceData) {
  var res = await supabase
    .from('services')
    .insert(serviceData)
    .select()
    .single()
  if (res.error) throw res.error
  return res.data
}

// ── updateService — update an existing listing ──
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

// ── deleteService — soft delete (set is_active = false) ──
export async function deleteService(id) {
  var res = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', id)
  if (res.error) throw res.error
}