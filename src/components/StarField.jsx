import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import './StarField.css'

const STAR_COUNT = 260
const PLANET_COLORS = [
  { name: 'Coral',    value: '#FF6B6B' },
  { name: 'Teal',     value: '#4ECDC4' },
  { name: 'Amber',    value: '#FFE66D' },
  { name: 'Lavender', value: '#BB8FCE' },
  { name: 'Sky',      value: '#85C1E9' },
  { name: 'Mint',     value: '#82E0AA' },
  { name: 'Rose',     value: '#F1948A' },
  { name: 'Peach',    value: '#F8C471' },
]

function generateStars(count, width, height) {
  const stars = []
  for (let i = 0; i < count; i++) {
    stars.push({
      id: `star-${i}`,
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.4 + Math.random() * 1.2,
      opacity: 0.15 + Math.random() * 0.4,
      twinkleDelay: Math.random() * 4
    })
  }
  return stars
}

const SAMPLE_PLANETS = [
  {
    id: 'sample-public',
    x_pct: 0.3,
    y_pct: 0.4,
    color: '#4ECDC4',
    name: 'Avalon',
    is_anonymous: false,
    user_id: 'demo-user-1',
  },
  {
    id: 'sample-anon',
    x_pct: 0.65,
    y_pct: 0.35,
    color: '#BB8FCE',
    name: 'Secret Garden',
    is_anonymous: true,
    user_id: 'demo-user-2',
  },
  {
    id: 'sample-mine',
    x_pct: 0.5,
    y_pct: 0.6,
    color: '#FF6B6B',
    name: 'My Planet',
    is_anonymous: true,
    user_id: '__current_user__',
  },
]

function Planet({ cx, cy, color, name, isAnonymous, isMine, onHover, onLeave }) {
  const displayName = isAnonymous ? (isMine ? name : 'momo') : name
  const showLabel = !isAnonymous || isMine

  return (
    <g
      className="planet-group"
      onMouseEnter={() => onHover?.({ x: cx, y: cy, name: displayName, isAnonymous, isMine })}
      onMouseLeave={onLeave}
    >
      {isMine && isAnonymous && (
        <circle cx={cx} cy={cy} r={18} fill={color} opacity={0.08} className="planet-mine-halo" />
      )}
      <circle cx={cx} cy={cy} r={12} fill="transparent" opacity={0.06} className="planet-orbit" stroke={color} strokeWidth={0.5} strokeDasharray="2 3" />

      <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.1} className="planet-glow" />
      <circle cx={cx} cy={cy} r={4.5} fill={color} className="planet-body" />
      <circle cx={cx} cy={cy - 1} r={1.5} fill="rgba(255,255,255,0.25)" />

      {showLabel && (
        <text x={cx} y={cy - 10} textAnchor="middle" className="planet-label" fill={color}>
          {displayName}
        </text>
      )}
      {isAnonymous && !isMine && (
        <text x={cx} y={cy - 10} textAnchor="middle" className="planet-label planet-label-anon" fill="rgba(255,255,255,0.35)">
          momo
        </text>
      )}
    </g>
  )
}

function PlanetCreator({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PLANET_COLORS[0].value)
  const [isAnonymous, setIsAnonymous] = useState(false)

  const handleSubmit = () => {
    if (!name.trim()) return
    onCreate({ name: name.trim(), color, is_anonymous: isAnonymous })
  }

  return (
    <div className="planet-creator-overlay" onClick={onClose}>
      <div className="planet-creator" onClick={e => e.stopPropagation()}>
        <div className="planet-creator-header">
          <span className="planet-creator-title">Plant Your Planet</span>
          <button className="planet-creator-close" onClick={onClose}>&times;</button>
        </div>

        <div className="planet-creator-preview">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="30" fill={color} opacity={0.1} className="planet-glow" />
            <circle cx="60" cy="60" r={18} fill={color} />
            <circle cx="60" cy="55" r={6} fill="rgba(255,255,255,0.2)" />
            <circle cx="60" cy="60" r={28} fill="transparent" stroke={color} strokeWidth={0.8} strokeDasharray="3 4" opacity={0.3} />
            {name && (
              <text x="60" y="100" textAnchor="middle" fill={color} fontSize="11" fontFamily="'Special Elite', cursive">
                {isAnonymous ? 'momo' : name}
              </text>
            )}
          </svg>
        </div>

        <div className="planet-creator-field">
          <label className="planet-creator-label">Planet Name</label>
          <input
            className="planet-creator-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name your planet..."
            maxLength={20}
          />
        </div>

        <div className="planet-creator-field">
          <label className="planet-creator-label">Color</label>
          <div className="planet-color-grid">
            {PLANET_COLORS.map(c => (
              <button
                key={c.value}
                className={`planet-color-swatch ${color === c.value ? 'active' : ''}`}
                style={{ background: c.value }}
                onClick={() => setColor(c.value)}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="planet-creator-field">
          <label className="planet-creator-toggle-row">
            <span className="planet-creator-label">Anonymous</span>
            <button
              className={`planet-toggle ${isAnonymous ? 'on' : ''}`}
              onClick={() => setIsAnonymous(!isAnonymous)}
            >
              <span className="planet-toggle-knob" />
            </button>
          </label>
          <span className="planet-creator-hint">
            {isAnonymous
              ? 'Others will see "momo". Only you know it\'s yours.'
              : 'Your planet name is visible to everyone.'}
          </span>
        </div>

        <button className="planet-creator-submit" onClick={handleSubmit} disabled={!name.trim()}>
          Launch into Orbit
        </button>
      </div>
    </div>
  )
}

function StarField() {
  const { user } = useAuth()
  const canvasRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 })
  const [bgStars, setBgStars] = useState([])
  const [planets, setPlanets] = useState([])
  const [showCreator, setShowCreator] = useState(false)
  const [hoveredPlanet, setHoveredPlanet] = useState(null)
  const [myPlanet, setMyPlanet] = useState(null)

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      setBgStars(generateStars(STAR_COUNT, dimensions.width, dimensions.height))
    }
  }, [dimensions])

  useEffect(() => {
    loadPlanets()
  }, [])

  useEffect(() => {
    if (user && planets.length > 0) {
      const mine = planets.find(p => p.user_id === user.id)
      setMyPlanet(mine || null)
    }
  }, [user, planets])

  const loadPlanets = async () => {
    try {
      const { data, error } = await supabase
        .from('planets')
        .select('*')
      if (!error && data && data.length > 0) {
        setPlanets(data)
      } else {
        setPlanets(SAMPLE_PLANETS)
      }
    } catch (e) {
      setPlanets(SAMPLE_PLANETS)
    }
  }

  const handleCreatePlanet = async ({ name, color, is_anonymous }) => {
    if (!user) return

    const x_pct = 0.15 + Math.random() * 0.7
    const y_pct = 0.15 + Math.random() * 0.7

    const newPlanet = {
      user_id: user.id,
      name,
      color,
      is_anonymous,
      x_pct,
      y_pct,
    }

    try {
      const { data, error } = await supabase
        .from('planets')
        .upsert(newPlanet, { onConflict: 'user_id' })
        .select()
        .single()

      if (!error && data) {
        setPlanets(prev => {
          const filtered = prev.filter(p => p.user_id !== user.id && !p.id.startsWith('sample-'))
          return [...filtered, data]
        })
        setMyPlanet(data)
      }
    } catch (e) {
      console.error('Failed to create planet:', e)
    }

    setShowCreator(false)
  }

  const handleCanvasClick = (e) => {
    if (e.target.closest('.planet-group')) return
    if (!user) return
    if (myPlanet && !myPlanet.id.startsWith('sample-')) return
    setShowCreator(true)
  }

  const isMine = useCallback((planet) => {
    if (planet.user_id === '__current_user__') return true
    return user && planet.user_id === user.id
  }, [user])

  return (
    <div className="starfield-wrapper" ref={canvasRef} onClick={handleCanvasClick}>
      <svg
        className="starfield-svg"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="planet-blur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {bgStars.map(star => (
          <circle
            key={star.id}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill="white"
            opacity={star.opacity}
            className="bg-star"
            style={{ animationDelay: `${star.twinkleDelay}s` }}
          />
        ))}

        {planets.map(planet => {
          const cx = planet.x_pct * dimensions.width
          const cy = planet.y_pct * dimensions.height
          const mine = isMine(planet)
          return (
            <Planet
              key={planet.id}
              cx={cx}
              cy={cy}
              color={planet.color}
              name={planet.name}
              isAnonymous={planet.is_anonymous}
              isMine={mine}
              onHover={setHoveredPlanet}
              onLeave={() => setHoveredPlanet(null)}
            />
          )
        })}
      </svg>

      {hoveredPlanet && (
        <div
          className="planet-tooltip"
          style={{ left: hoveredPlanet.x, top: hoveredPlanet.y - 30 }}
        >
          {hoveredPlanet.name}
          {hoveredPlanet.isMine && <span className="planet-tooltip-mine"> (you)</span>}
        </div>
      )}

      {/* Sample legend */}
      <div className="starfield-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#4ECDC4' }} />
          <span>Public — name visible</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot-anon" style={{ background: '#BB8FCE' }} />
          <span>Anonymous — shows "momo"</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot-mine" style={{ background: '#FF6B6B' }} />
          <span>Yours (anon) — halo only you see</span>
        </div>
      </div>

      {!user && (
        <div className="starfield-hint">sign in to plant your planet</div>
      )}
      {user && !myPlanet && (
        <div className="starfield-hint starfield-hint-active">click anywhere to plant your planet</div>
      )}

      {showCreator && (
        <PlanetCreator
          onClose={() => setShowCreator(false)}
          onCreate={handleCreatePlanet}
        />
      )}
    </div>
  )
}

export default StarField
