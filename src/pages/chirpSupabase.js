import { supabase } from '../supabaseClient'
import {
  CHIRP_PLANETS,
  getAllPersonas,
  formatActivityTime,
  getPlanetRecent,
  hydratePlanet,
  truncateRecentMessage
} from './chirpShared'

const byType = (type) => CHIRP_PLANETS.find(planet => planet.id === type) || CHIRP_PLANETS[0]

const toClientPlanet = (row) => {
  const template = byType(row.type)
  return hydratePlanet({
    ...template,
    id: row.type || template.id,
    dbId: row.id,
    roomName: row.name || template.roomName,
    cardTitle: row.name || template.roomName,
    tone: row.tone || template.tone,
    background: row.background || template.background,
    avatarKey: row.avatar_key || template.id,
    updatedAt: row.updated_at,
    createdAt: row.created_at
  })
}

const defaultPlanetPayload = (userId, planet) => ({
  owner_id: userId,
  name: planet.roomName,
  type: planet.id,
  tone: planet.tone,
  background: planet.background,
  avatar_key: planet.id
})

export async function loadChirpProfile(user) {
  if (!user) return null
  const { data, error } = await supabase
    .from('chirp_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    animal: data.animal,
    animalName: data.animal_name,
    birdName: data.bird_name || 'Bird',
    mbti: data.mbti,
    focus: data.focus,
    completedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now()
  }
}

export async function saveChirpProfile(user, profile) {
  if (!user) return null
  const payload = {
    user_id: user.id,
    animal: profile.animal,
    animal_name: profile.animalName,
    bird_name: profile.birdName || 'Bird',
    mbti: profile.mbti || null,
    focus: profile.focus || null,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('chirp_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function loadChirpPlanets(user) {
  if (!user) return CHIRP_PLANETS.map(hydratePlanet)

  const { data, error } = await supabase
    .from('chirp_planets')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw error

  const existing = []
  const seenTypes = new Set()
  ;(data || []).forEach(row => {
    const key = row.type || row.id
    if (seenTypes.has(key)) return
    seenTypes.add(key)
    existing.push(row)
  })
  const existingTypes = new Set(existing.map(row => row.type))
  const missingDefaults = CHIRP_PLANETS.filter(planet => !existingTypes.has(planet.id))

  if (missingDefaults.length > 0) {
    const { error: insertError } = await supabase
      .from('chirp_planets')
      .insert(missingDefaults.map(planet => defaultPlanetPayload(user.id, planet)))

    if (insertError) throw insertError

    const { data: refreshed, error: refreshError } = await supabase
      .from('chirp_planets')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })

    if (refreshError) throw refreshError
    return (refreshed || []).map(toClientPlanet)
  }

  return existing.map(toClientPlanet)
}

export async function updateChirpPlanet(planet, patch) {
  if (!planet?.dbId) return null

  const payload = {
    updated_at: new Date().toISOString()
  }
  if (patch.roomName || patch.name) payload.name = patch.roomName || patch.name
  if (patch.background) payload.background = patch.background
  if (patch.tone) payload.tone = patch.tone
  if (patch.avatarKey) payload.avatar_key = patch.avatarKey

  const { data, error } = await supabase
    .from('chirp_planets')
    .update(payload)
    .eq('id', planet.dbId)
    .select()
    .single()

  if (error) throw error
  return toClientPlanet(data)
}

export async function loadChirpMessages(planet) {
  if (!planet?.dbId) return null

  const { data, error } = await supabase
    .from('chirp_messages')
    .select('*')
    .eq('planet_id', planet.dbId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data || []).map(row => ({
    id: row.id,
    type: row.sender_type,
    agentId: row.sender_type === 'agent' ? row.sender_id : undefined,
    text: row.text || '',
    tapbacks: Array.isArray(row.tapbacks) ? row.tapbacks : [],
    read: row.sender_type === 'user',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
  }))
}

export async function saveChirpMessage(planet, message) {
  if (!planet?.dbId || !message?.type) return null

  const payload = {
    planet_id: planet.dbId,
    sender_type: message.type,
    sender_id: message.agentId || (message.type === 'user' ? 'user' : null),
    text: message.text || '',
    tapbacks: message.tapbacks || []
  }

  const { data, error } = await supabase
    .from('chirp_messages')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function loadPlanetActivityFromMessages(planets) {
  const dbIds = planets.map(planet => planet.dbId).filter(Boolean)
  if (!dbIds.length) return {}

  const { data, error } = await supabase
    .from('chirp_messages')
    .select('planet_id,text,created_at,sender_type')
    .in('planet_id', dbIds)
    .in('sender_type', ['user', 'memo'])
    .order('created_at', { ascending: false })

  if (error) throw error

  const activity = {}
  const byDbId = new Map(planets.map(planet => [planet.dbId, planet]))
  ;(data || []).forEach(row => {
    const planet = byDbId.get(row.planet_id)
    if (!planet || activity[planet.id]) return
    const timestamp = row.created_at ? new Date(row.created_at).getTime() : Date.now()
    activity[planet.id] = {
      text: truncateRecentMessage(row.text, 25),
      rawText: row.text,
      timestamp,
      time: formatActivityTime(timestamp)
    }
  })

  planets.forEach(planet => {
    if (!activity[planet.id]) activity[planet.id] = getPlanetRecent(planet)
  })

  return activity
}

export async function loadCustomPersonas(user) {
  if (!user) return []

  const { data, error } = await supabase
    .from('chirp_personas')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map(row => ({
    id: row.id,
    dbId: row.id,
    name: row.name,
    role: row.role || 'custom persona',
    description: row.description || 'A custom persona created by you for private Planet conversations.',
    systemPrompt: row.system_prompt || '',
    skills: row.skills || '',
    avatarUrl: row.avatar_url || '',
    color: row.color || '#F5C878',
    pricing: row.pricing || 'free',
    usageCount: row.usage_count || 0,
    isOfficial: row.is_official || false,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
  }))
}

export async function saveCustomPersonaToSupabase(user, persona) {
  if (!user) return null

  const payload = {
    creator_id: user.id,
    name: persona.name,
    role: persona.role || 'custom persona',
    description: persona.description || '',
    system_prompt: persona.systemPrompt || '',
    skills: persona.skills || '',
    avatar_url: persona.avatarUrl || '',
    color: persona.color || '#F5C878',
    pricing: persona.pricing || 'free',
    usage_count: persona.usageCount || 0,
    is_official: false,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('chirp_personas')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadPersonaAvatar(user, file) {
  if (!user || !file) return ''

  const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
  const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'png'
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExtension}`

  const { error } = await supabase
    .storage
    .from('chirp-avatars')
    .upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type || 'image/png',
      upsert: false
    })

  if (error) throw error

  const { data } = supabase
    .storage
    .from('chirp-avatars')
    .getPublicUrl(path)

  return data.publicUrl || ''
}

const uniquePersonasById = (personas) => {
  const seen = new Set()
  return personas.filter(persona => {
    if (!persona?.id || seen.has(persona.id)) return false
    seen.add(persona.id)
    return true
  })
}

export async function loadPlanetMemberPersonas(planet, fallbackAgents = [], personaCatalog = []) {
  if (!planet?.dbId) return fallbackAgents

  const { data, error } = await supabase
    .from('chirp_planet_members')
    .select('*')
    .eq('planet_id', planet.dbId)
    .order('position', { ascending: true })

  if (error) throw error
  if (!data?.length) return fallbackAgents

  const allPersonas = uniquePersonasById([
    ...getAllPersonas(),
    ...fallbackAgents,
    ...personaCatalog
  ])
  const mapped = data
    .filter(row => row.member_type === 'persona')
    .map(row => allPersonas.find(persona => (
      persona.id === row.persona_key || persona.id === row.persona_id
    )))
    .filter(Boolean)

  return mapped.length ? mapped : fallbackAgents
}

export async function savePlanetMemberPersonas(planet, personas) {
  if (!planet?.dbId) return null

  const { error: deleteError } = await supabase
    .from('chirp_planet_members')
    .delete()
    .eq('planet_id', planet.dbId)
    .eq('member_type', 'persona')

  if (deleteError) throw deleteError

  const rows = personas.map((persona, index) => ({
    planet_id: planet.dbId,
    member_type: 'persona',
    persona_key: persona.id,
    persona_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(persona.id) ? persona.id : null,
    position: index
  }))

  if (!rows.length) return []

  const { data, error } = await supabase
    .from('chirp_planet_members')
    .insert(rows)
    .select()

  if (error) throw error
  window.dispatchEvent(new CustomEvent('chirp:planet-personas-updated', { detail: { planetId: planet.id } }))
  return data
}
