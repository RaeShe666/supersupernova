const ACTIVITY_KEY = 'chirpPlanetActivity'

export const formatMessageTime = (date = new Date()) => (
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
)

export const truncateRecentMessage = (text = '', limit = 25) => {
  const clean = String(text).replace(/\s+/g, ' ').trim()
  if (!clean) return ''

  const hasCjk = /[\u3400-\u9FFF]/.test(clean)
  if (hasCjk) {
    return clean.length > limit ? `${clean.slice(0, limit)}...` : clean
  }

  const words = clean.split(' ')
  return words.length > limit ? `${words.slice(0, limit).join(' ')}...` : clean
}

export const readPlanetActivity = () => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(ACTIVITY_KEY) || '{}')
  } catch {
    return {}
  }
}

export const writePlanetActivity = (planetId, message, timestamp = Date.now()) => {
  if (typeof window === 'undefined' || !planetId || !message) return

  const next = {
    ...readPlanetActivity(),
    [planetId]: {
      text: truncateRecentMessage(message, 25),
      rawText: message,
      timestamp,
      time: formatMessageTime(new Date(timestamp))
    }
  }

  window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('chirp:planet-activity', { detail: { planetId, activity: next[planetId] } }))
}

export const getPlanetRecent = (planet) => {
  const activity = readPlanetActivity()[planet.id]
  if (activity?.text) return activity
  return {
    text: truncateRecentMessage(planet.recent, 25),
    rawText: planet.recent,
    timestamp: null,
    time: planet.time
  }
}

export const DeerAvatar = () => (
  <svg viewBox="0 0 64 64" className="chirp-avatar-svg" aria-hidden="true">
    <path d="M20 24c-5-8-9-9-12-7" />
    <path d="M44 24c5-8 9-9 12-7" />
    <path d="M25 17c-2-7-6-9-10-9" />
    <path d="M39 17c2-7 6-9 10-9" />
    <ellipse cx="32" cy="36" rx="17" ry="15" />
    <circle cx="25" cy="34" r="2.5" />
    <circle cx="39" cy="34" r="2.5" />
    <path d="M29 42c2 2 4 2 6 0" />
  </svg>
)

export const BirdAvatar = () => (
  <svg viewBox="0 0 100 100" className="chirp-avatar-svg" aria-hidden="true">
    <path d="M30 58 C30 46 38 34 52 34 C66 34 74 44 72 56 C70 66 60 70 48 70 C38 70 30 66 30 58 Z" />
    <path d="M30 62 L18 66 L24 70 Z" />
    <circle cx="58" cy="44" r="2.5" />
    <path d="M70 48 L80 46 L72 53 Z" />
    <path d="M44 56 Q50 52 58 56" />
    <path d="M44 70 L44 76" />
    <path d="M54 70 L54 76" />
    <path d="M12 80 Q50 84 90 76" />
    <path d="M78 75 Q82 70 86 73 Q84 78 78 75 Z" />
    <path d="M22 24 L22 28 M19 26 L25 26" />
  </svg>
)

export const CatAvatar = () => (
  <svg viewBox="0 0 64 64" className="chirp-avatar-svg" aria-hidden="true">
    <path d="M18 25 15 10l13 9" />
    <path d="M46 25 49 10l-13 9" />
    <path d="M16 34c0-12 8-19 16-19s16 7 16 19-7 18-16 18-16-6-16-18z" />
    <circle cx="25" cy="34" r="2.5" />
    <circle cx="39" cy="34" r="2.5" />
    <path d="M32 39v4" />
    <path d="M25 45c4 3 10 3 14 0" />
  </svg>
)

export const FoxAvatar = () => (
  <svg viewBox="0 0 64 64" className="chirp-avatar-svg" aria-hidden="true">
    <path d="M12 25 22 9l10 11L42 9l10 16c1 17-7 27-20 27S11 42 12 25z" />
    <circle cx="25" cy="32" r="2.5" />
    <circle cx="39" cy="32" r="2.5" />
    <path d="M28 40c2 2 6 2 8 0" />
  </svg>
)

export const OwlAvatar = () => (
  <svg viewBox="0 0 64 64" className="chirp-avatar-svg" aria-hidden="true">
    <path d="M17 23 13 12l11 5c5-3 11-3 16 0l11-5-4 11c4 5 5 13 2 19-4 9-13 12-17 12S19 51 15 42c-3-6-2-14 2-19z" />
    <circle cx="25" cy="33" r="5" />
    <circle cx="39" cy="33" r="5" />
    <path d="M30 42h4" />
  </svg>
)

export const RabbitAvatar = () => (
  <svg viewBox="0 0 64 64" className="chirp-avatar-svg" aria-hidden="true">
    <path d="M23 23C18 9 19 3 24 3s7 8 7 18" />
    <path d="M41 23C46 9 45 3 40 3s-7 8-7 18" />
    <ellipse cx="32" cy="39" rx="17" ry="15" />
    <circle cx="25" cy="37" r="2.5" />
    <circle cx="39" cy="37" r="2.5" />
    <path d="M28 45c2 2 6 2 8 0" />
  </svg>
)

export function UserAvatar() {
  return (
    <span className="chirp-user-photo" aria-label="User avatar">
      S
    </span>
  )
}

export const PERSONA_POOL = [
  { id: 'lovebrain', name: '恋爱脑', role: '情绪雷达', color: '#E8A29C', avatar: CatAvatar, emoji: '🙂' },
  { id: 'strategist', name: '军师', role: '关系拆解', color: '#A8C5DA', avatar: FoxAvatar, emoji: '🤔' },
  { id: 'owl', name: '夜航猫头鹰', role: '边界观察', color: '#C4B0D9', avatar: OwlAvatar, emoji: '🌙' },
  { id: 'rabbit', name: '软着陆', role: '温柔承接', color: '#A8C5A0', avatar: RabbitAvatar, emoji: '🫶' }
]

export const BIRD = {
  id: 'bird',
  name: 'Bird',
  role: 'Admin',
  color: '#F5C878',
  avatar: BirdAvatar
}

export const CHIRP_PLANETS = [
  {
    id: 'love',
    type: 'love',
    name: '恋爱',
    roomName: '恋爱观察室',
    tone: 'relationship, romantic uncertainty, attachment, emotional reading',
    color: '#E8A29C',
    background: '#FAFAF7',
    cardClass: 'love',
    avatar: CatAvatar,
    agents: ['lovebrain', 'strategist'],
    recent: 'You said you didn\'t mind...',
    time: '12:42'
  },
  {
    id: 'work',
    type: 'work',
    name: '职场',
    roomName: '职场作战室',
    tone: 'work, career decisions, communication, conflict and planning',
    color: '#A8C5DA',
    background: '#FAFAF7',
    cardClass: 'work',
    avatar: FoxAvatar,
    agents: ['strategist', 'owl'],
    recent: 'About that deck yesterday...',
    time: '09:18'
  }
]

export const getPlanetById = (planetId) => (
  CHIRP_PLANETS.find(planet => planet.id === planetId) || CHIRP_PLANETS[0]
)

export const getPersonasForPlanet = (planet) => (
  (planet?.agents || CHIRP_PLANETS[0].agents)
    .map(id => PERSONA_POOL.find(persona => persona.id === id))
    .filter(Boolean)
)
