import { useEffect, useMemo, useState } from 'react'
import ChirpPage from './ChirpPage'
import {
  addPersonaToPlanet,
  BIRD,
  buildPersonaTheme,
  CHIRP_PLANETS,
  getAllPersonas,
  getPlanetById,
  getPlanetRecent,
  getPersonaTheme,
  PersonaAvatar,
  readPlanetActivity,
  saveCustomPersona,
  truncateTitle
} from './chirpShared'
import './ChirpHomePage.css'

const navigateTo = (...segments) => {
  window.location.hash = '/' + segments.filter(Boolean).join('/')
}

const HomeBird = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="#1F1F1F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M30 58 C30 46 38 34 52 34 C66 34 74 44 72 56 C70 66 60 70 48 70 C38 70 30 66 30 58 Z" />
    <path d="M30 62 L18 66 L24 70 Z" />
    <circle cx="58" cy="44" r="2.5" fill="#1F1F1F" stroke="none" />
    <path d="M70 48 L80 46 L72 53 Z" fill="#E26B4E" strokeWidth="2.2" />
    <path d="M44 56 Q50 52 58 56" />
    <path d="M44 70 L44 76" />
    <path d="M54 70 L54 76" />
    <path d="M12 80 Q50 84 90 76" strokeWidth="4" />
    <path d="M78 75 Q82 70 86 73 Q84 78 78 75 Z" fill="#9BC494" strokeWidth="2.2" />
    <path d="M22 24 L22 28 M19 26 L25 26" strokeWidth="2" />
  </svg>
)

const LoveCat = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="#2A2A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M28 38 L34 22 L44 36 Z" fill="#E8A29C" />
    <path d="M72 38 L66 22 L56 36 Z" fill="#E8A29C" />
    <ellipse cx="50" cy="56" rx="26" ry="24" fill="#F5C9D2" />
    <circle cx="42" cy="54" r="2" fill="#2A2A2A" />
    <circle cx="58" cy="54" r="2" fill="#2A2A2A" />
    <path d="M48 62 Q50 65 52 62" />
    <path d="M50 62 L50 66" />
    <path d="M36 58 L30 56" />
    <path d="M36 60 L30 62" />
    <path d="M64 58 L70 56" />
    <path d="M64 60 L70 62" />
  </svg>
)

const WorkFox = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="#2A2A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M26 36 L32 18 L44 32 Z" fill="#D6A77A" />
    <path d="M74 36 L68 18 L56 32 Z" fill="#D6A77A" />
    <path d="M30 55 Q50 30 70 55 Q70 78 50 80 Q30 78 30 55 Z" fill="#E8B888" />
    <path d="M38 62 Q50 52 62 62 Q62 74 50 74 Q38 74 38 62 Z" fill="#FBF1ED" />
    <circle cx="42" cy="56" r="2" fill="#2A2A2A" />
    <circle cx="58" cy="56" r="2" fill="#2A2A2A" />
    <path d="M48 66 Q50 68 52 66" />
    <ellipse cx="50" cy="64" rx="2" ry="1.4" fill="#2A2A2A" />
  </svg>
)

const CreatePlanetIcon = () => (
  <svg viewBox="0 0 60 60" fill="none" stroke="#2A2A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="30" cy="32" r="14" fill="#F4F1E6" />
    <ellipse cx="30" cy="32" rx="20" ry="5" transform="rotate(-18 30 32)" />
    <circle cx="26" cy="30" r="1.2" fill="#2A2A2A" />
    <circle cx="34" cy="34" r="1.2" fill="#2A2A2A" />
    <path d="M48 14 L48 20 M45 17 L51 17" />
  </svg>
)

const BrushIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#FAFAF7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20 Q5 17 8 16 L16 8 L18 10 L10 18 Q9 21 4 20 Z" />
    <path d="M14 6 L18 10" />
    <path d="M16 4 L20 8" />
  </svg>
)

const planetArt = {
  love: LoveCat,
  work: WorkFox
}

const getCardTitle = (planet) => (planet.id === 'work' ? 'My Odyssey' : 'Crush with...')
const DRAWER_MIN_WIDTH = 260
const DRAWER_DEFAULT_WIDTH = 300
const DRAWER_MAX_WIDTH = 340

const rgbToHex = (r, g, b) => (
  `#${[r, g, b].map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`
)

const extractDominantColor = (src) => new Promise((resolve) => {
  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement('canvas')
    const size = 32
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      resolve('#F5C878')
      return
    }

    context.drawImage(image, 0, 0, size, size)
    const { data } = context.getImageData(0, 0, size, size)
    let r = 0
    let g = 0
    let b = 0
    let total = 0

    for (let index = 0; index < data.length; index += 16) {
      const alpha = data[index + 3]
      if (alpha < 80) continue
      const red = data[index]
      const green = data[index + 1]
      const blue = data[index + 2]
      const brightness = (red + green + blue) / 3
      if (brightness > 238 || brightness < 18) continue
      r += red
      g += green
      b += blue
      total += 1
    }

    resolve(total ? rgbToHex(r / total, g / total, b / total) : '#F5C878')
  }
  image.onerror = () => resolve('#F5C878')
  image.src = src
})

const getPersonaThemeStyle = (persona) => {
  const theme = getPersonaTheme(persona)
  return {
    '--persona-card-a': theme.card[0],
    '--persona-card-b': theme.card[1],
    '--persona-card-c': theme.card[2],
    '--persona-avatar-bg': theme.avatar
  }
}

function ChirpHomePage({ page, id }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('menu')
  const [drawerWidth, setDrawerWidth] = useState(DRAWER_DEFAULT_WIDTH)
  const [planetActivity, setPlanetActivity] = useState(() => readPlanetActivity())
  const [personas, setPersonas] = useState(() => getAllPersonas())
  const selectedPlanet = useMemo(() => (
    page === 'planet' ? getPlanetById(id) : null
  ), [page, id])

  const recentFor = (planet) => planetActivity[planet.id] || getPlanetRecent(planet)

  const openPlanetDrawer = () => {
    setDrawerMode('planets')
    setDrawerOpen(true)
  }

  const startDrawerResize = (event) => {
    event.preventDefault()
    const updateWidth = (moveEvent) => {
      const nextWidth = Math.min(DRAWER_MAX_WIDTH, Math.max(DRAWER_MIN_WIDTH, moveEvent.clientX))
      setDrawerWidth(nextWidth)
    }
    const stopResize = () => {
      window.removeEventListener('mousemove', updateWidth)
      window.removeEventListener('mouseup', stopResize)
    }

    window.addEventListener('mousemove', updateWidth)
    window.addEventListener('mouseup', stopResize)
  }

  useEffect(() => {
    const openMenu = () => {
      setDrawerMode('menu')
      setDrawerOpen(true)
    }
    const refreshActivity = () => setPlanetActivity(readPlanetActivity())
    const refreshPersonas = () => setPersonas(getAllPersonas())

    window.addEventListener('chirp:open-menu', openMenu)
    window.addEventListener('chirp:planet-activity', refreshActivity)
    window.addEventListener('chirp:personas-updated', refreshPersonas)
    window.addEventListener('storage', refreshActivity)
    return () => {
      window.removeEventListener('chirp:open-menu', openMenu)
      window.removeEventListener('chirp:planet-activity', refreshActivity)
      window.removeEventListener('chirp:personas-updated', refreshPersonas)
      window.removeEventListener('storage', refreshActivity)
    }
  }, [])

  if (selectedPlanet) {
    return (
      <div className="chirp-home-detail">
        <ChirpPage planetConfig={selectedPlanet} onBack={openPlanetDrawer} />
        <SideDrawer open={drawerOpen} mode={drawerMode} setMode={setDrawerMode} onClose={() => setDrawerOpen(false)} recentFor={recentFor} drawerWidth={drawerWidth} onResizeStart={startDrawerResize} />
      </div>
    )
  }

  if (page === 'persona') {
    return (
      <div className="chirp-home-page">
        <PersonaPage personas={personas} onPersonasChange={() => setPersonas(getAllPersonas())} />
        <SideDrawer open={drawerOpen} mode={drawerMode} setMode={setDrawerMode} onClose={() => setDrawerOpen(false)} recentFor={recentFor} drawerWidth={drawerWidth} onResizeStart={startDrawerResize} />
      </div>
    )
  }

  return (
    <div className="chirp-home-page">
      <main className="content">
        <div className="bird-strip">
          <div className="bird-avatar"><HomeBird /></div>
          <div className="bird-text">
            <div className="bird-name">Bird · 07:42</div>
            <div className="bird-msg">
              Morning, Goldie — last night in <em role="button" tabIndex="0" onClick={() => navigateTo('chirp', 'planet', 'love')} onKeyDown={(event) => event.key === 'Enter' && navigateTo('chirp', 'planet', 'love')}>Crush with...</em> you wrote "never mind, let it go." That softness shows up a lot this week.
            </div>
          </div>
        </div>

        <div className="sec-label">My Planets</div>
        <div className="planets-grid">
          {CHIRP_PLANETS.map((planet) => (
            <PlanetCard key={planet.id} planet={planet} recent={recentFor(planet)} />
          ))}

          <button className="planet-card pc-create" type="button">
            <div className="pc-create-illu"><CreatePlanetIcon /></div>
            <div className="pc-create-title">My Planet</div>
            <div className="pc-create-desc">Name it. Color it. Make it yours.</div>
            <span className="pc-create-btn"><span className="ic">+</span>CREATE</span>
          </button>
        </div>

        <div className="sec-label moments-label">Moments</div>
        <div className="moments-card">
          <div className="moments-row">
            <div className="moments-body">
              <div className="moment-themes">
                <div className="moment-theme">
                  <div className="mt-label"><span className="mt-dot"></span>Private</div>
                  <div className="mt-text zh" lang="zh">路过咖啡店，猫在晒太阳，眼睛眯起来。我也想被那样晒...</div>
                  <div className="mt-date">Last night · May 15</div>
                </div>
                <div className="moment-theme">
                  <div className="mt-label shared"><span className="mt-dot"></span>Shared · with M.</div>
                  <div className="mt-text">Fourth draft of the deck. Reads steadier...</div>
                  <div className="mt-date">Today · May 16</div>
                </div>
              </div>

              <div className="moments-cta-row">
                <button className="moments-cta" type="button">
                  <span className="moments-cta-icon"><BrushIcon /></span>
                  Write
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SideDrawer open={drawerOpen} mode={drawerMode} setMode={setDrawerMode} onClose={() => setDrawerOpen(false)} recentFor={recentFor} drawerWidth={drawerWidth} onResizeStart={startDrawerResize} />
    </div>
  )
}

function PlanetCard({ planet, recent }) {
  const Art = planetArt[planet.id] || LoveCat
  const className = planet.id === 'work' ? 'pc-work' : 'pc-love'

  return (
    <button className={`planet-card ${className}`} type="button" onClick={() => navigateTo('chirp', 'planet', planet.id)}>
      <div className="pc-avatar"><Art /></div>
      <div className="pc-name">{getCardTitle(planet)}</div>
      <div className="pc-quote">{recent.text}</div>
      <time className="pc-time">{recent.time}</time>
    </button>
  )
}

function PersonaPage({ personas, onPersonasChange }) {
  const [creatorOpen, setCreatorOpen] = useState(false)
  const [usePersona, setUsePersona] = useState(null)
  const [toast, setToast] = useState('')
  const [draft, setDraft] = useState({
    name: '',
    role: '',
    description: '',
    systemPrompt: '',
    skills: '',
    avatarUrl: '',
    color: '#F5C878'
  })

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 1024 * 1024) {
      showToast('Avatar must be under 1MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const avatarUrl = reader.result
      const color = await extractDominantColor(avatarUrl)
      setDraft(prev => ({ ...prev, avatarUrl, color }))
    }
    reader.readAsDataURL(file)
  }

  const createPersona = () => {
    const name = draft.name.trim()
    const systemPrompt = draft.systemPrompt.trim()
    if (!name || !systemPrompt) {
      showToast('Name and system prompt are required.')
      return
    }

    saveCustomPersona({
      id: `custom-${Date.now()}`,
      name,
      role: draft.role.trim() || 'custom persona',
      description: draft.description.trim() || 'A custom persona created by you for private Planet conversations.',
      systemPrompt,
      skills: draft.skills.trim(),
      avatarUrl: draft.avatarUrl,
      color: draft.color || '#F5C878',
      theme: buildPersonaTheme(draft.color || '#F5C878'),
      pricing: 'free',
      usageCount: 0,
      createdAt: Date.now()
    })
    setDraft({ name: '', role: '', description: '', systemPrompt: '', skills: '', avatarUrl: '', color: '#F5C878' })
    setCreatorOpen(false)
    onPersonasChange()
    showToast('Persona created.')
  }

  const attachPersona = (planet, persona) => {
    addPersonaToPlanet(planet.id, persona.id)
    setUsePersona(null)
    showToast(`${persona.name} added to ${planet.roomName}.`)
  }

  return (
    <main className="chirp-persona-page">
      <div className="chirp-persona-head">
        <p>Persona</p>
        <h1>Find a persona for the planet.</h1>
      </div>

      <div className="chirp-persona-grid">
        <button className="chirp-persona-card chirp-persona-create" type="button" onClick={() => setCreatorOpen(true)}>
          <div className="persona-title-row persona-create-title-row">
            <span className="persona-avatar persona-create-avatar">+</span>
            <strong>Create Persona</strong>
          </div>
          <p>Write a system prompt, define skills, and upload an avatar.</p>
          <div className="persona-card-foot">
            <span className="persona-create-button">Create</span>
          </div>
        </button>

        {personas.map(persona => (
          <article className={`chirp-persona-card persona-${persona.pricing}`} key={persona.id} style={getPersonaThemeStyle(persona)}>
            <div className="persona-price">{persona.pricing === 'paid' ? 'Paid' : 'Free'}</div>
            <div className="persona-title-row">
              <div className="persona-avatar"><PersonaAvatar persona={persona} /></div>
              <h2>{persona.name}</h2>
            </div>
            <p>{persona.description}</p>
            <div className="persona-card-foot">
              <span>{persona.usageCount || 0} in use</span>
              <button type="button" onClick={() => setUsePersona(persona)}>Use</button>
            </div>
          </article>
        ))}
      </div>

      {creatorOpen && (
        <div className="persona-modal-layer">
          <section className="persona-modal">
            <button className="persona-modal-close" type="button" onClick={() => setCreatorOpen(false)}>×</button>
            <h2>Create Persona</h2>
            <label>
              <span>Name</span>
              <input value={draft.name} onChange={(event) => setDraft(prev => ({ ...prev, name: event.target.value }))} />
            </label>
            <label>
              <span>Skill</span>
              <input value={draft.skills} onChange={(event) => setDraft(prev => ({ ...prev, skills: event.target.value }))} />
            </label>
            <label>
              <span>Short intro</span>
              <textarea value={draft.description} onChange={(event) => setDraft(prev => ({ ...prev, description: event.target.value }))} rows="3" />
            </label>
            <label>
              <span>System prompt</span>
              <textarea value={draft.systemPrompt} onChange={(event) => setDraft(prev => ({ ...prev, systemPrompt: event.target.value }))} rows="5" />
            </label>
            <label className="persona-avatar-upload">
              <span>Avatar</span>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            </label>
            <button className="persona-primary" type="button" onClick={createPersona}>Create</button>
          </section>
        </div>
      )}

      {usePersona && (
        <div className="persona-modal-layer">
          <section className="persona-use-panel">
            <button className="persona-modal-close" type="button" onClick={() => setUsePersona(null)}>×</button>
            <h2>Add to Planet</h2>
            {CHIRP_PLANETS.map(planet => {
              const Avatar = planet.avatar
              return (
                <div className="persona-planet-row" key={planet.id}>
                  <span style={{ backgroundColor: planet.color }}><Avatar /></span>
                  <strong>{planet.roomName}</strong>
                  <button type="button" onClick={() => attachPersona(planet, usePersona)}>+</button>
                </div>
              )
            })}
          </section>
        </div>
      )}

      {toast && <div className="chirp-toast persona-toast">{toast}</div>}
    </main>
  )
}

function DrawerPlanetCard({ planet, onClick, recent }) {
  const Art = planetArt[planet.id] || LoveCat
  const className = planet.id === 'work' ? 'pc-work' : 'pc-love'

  return (
    <button className={`planet-card drawer-planet-card ${className}`} type="button" onClick={onClick}>
      <div className="drawer-planet-main">
        <div className="pc-avatar"><Art /></div>
        <div className="drawer-planet-copy">
          <div className="drawer-planet-row">
            <div className="pc-name">{truncateTitle(getCardTitle(planet), 4)}</div>
            <time className="pc-time">{recent.time}</time>
          </div>
          <div className="pc-quote">{recent.rawText || recent.text}</div>
        </div>
      </div>
    </button>
  )
}

function SideDrawer({ open, mode, setMode, onClose, recentFor, drawerWidth, onResizeStart }) {
  return (
    <>
      {open && <button className="chirp-home-drawer-scrim" type="button" aria-label="Close menu" onClick={onClose} />}
      <aside className={`chirp-home-drawer ${open ? 'open' : ''}`} style={{ '--drawer-width': `${drawerWidth}px` }}>
        <div className="chirp-home-drawer-head">
          {mode === 'planets' ? (
            <strong>My Planet</strong>
          ) : (
            <button
              className="chirp-home-drawer-home"
              type="button"
              onClick={() => {
                onClose()
                navigateTo('chirp')
              }}
            >
              home
            </button>
          )}
          <button type="button" aria-label="Close menu" onClick={onClose}>×</button>
        </div>

        {mode === 'menu' ? (
          <div className="chirp-home-menu-list">
            <button
              type="button"
              onClick={() => {
                onClose()
                setMode('planets')
                navigateTo('chirp', 'planet', CHIRP_PLANETS[0].id)
              }}
            >
              <span>◐</span><strong>Planet</strong>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                navigateTo('chirp', 'persona')
              }}
            >
              <span>◎</span><strong>Persona</strong>
            </button>
            <button type="button"><span>✎</span><strong>Moments</strong></button>
            <button type="button"><span>✦</span><strong>About Me</strong></button>
          </div>
        ) : (
          <div className="chirp-home-drawer-planets">
            <button className="planet-card pc-create drawer-planet-card drawer-create-card" type="button" aria-label="Create planet">
              <span className="drawer-create-plus">+</span>
              <span className="drawer-create-label">create my planet</span>
            </button>
            {CHIRP_PLANETS.map(planet => (
              <DrawerPlanetCard
                key={planet.id}
                planet={planet}
                recent={recentFor(planet)}
                onClick={() => {
                  onClose()
                  navigateTo('chirp', 'planet', planet.id)
                }}
              />
            ))}
          </div>
        )}

        <div className="chirp-home-drawer-admin">
          <span style={{ backgroundColor: BIRD.color }}><BIRD.avatar /></span>
          <strong>Bird</strong>
          <button type="button">Chat</button>
        </div>
        <button className="chirp-home-drawer-resize" type="button" aria-label="Resize sidebar" onMouseDown={onResizeStart} />
      </aside>
    </>
  )
}

export default ChirpHomePage
