import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ChirpPage from './ChirpPage'
import {
  addPersonaToPlanet,
  BIRD,
  buildPersonaTheme,
  CHIRP_PLANETS,
  getAllPlanets,
  getAllPersonas,
  getPlanetById,
  getPlanetRecent,
  getPersonaTheme,
  PersonaAvatar,
  readPlanetActivity,
  saveCustomPersona,
  truncateTitle
} from './chirpShared'
import {
  loadChirpPlanets,
  loadChirpProfile,
  loadCustomPersonas,
  loadPlanetActivityFromMessages,
  loadPlanetMemberPersonas,
  saveChirpProfile,
  saveCustomPersonaToSupabase,
  savePlanetMemberPersonas,
  uploadPersonaAvatar
} from './chirpSupabase'
import './ChirpHomePage.css'

const navigateTo = (...segments) => {
  window.location.hash = '/' + segments.filter(Boolean).join('/')
}

const HomeBird = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="#1F1F1F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M30 58 C30 46 38 34 52 34 C66 34 74 44 72 56 C70 66 60 70 48 70 C38 70 30 66 30 58 Z" fill="#DCC4EA" />
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
const getPlanetCardTitle = (planet) => planet.cardTitle || getCardTitle(planet)
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

const DEFAULT_PERSONA_COLOR = '#DCC4EA'
const PERSONA_AVATAR_COLORS = [DEFAULT_PERSONA_COLOR, '#EBA7B5', '#A9C9DF', '#A9CDA0', '#F5C878', '#F0A48A', '#9DC7B5']

const getPersonaAvatarLabel = (name) => {
  const firstWord = name.trim().split(/\s+/)[0] || 'P'
  if (/^[\u4e00-\u9fff]/.test(firstWord)) return firstWord.slice(0, 1)
  return firstWord.slice(0, 2).toUpperCase()
}

export const CHIRP_PROFILE_KEY = 'chirpOnboardingProfile'
const ONBOARDING_FLOW = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']
const ONBOARDING_SCORES = {
  q1: [[-1, +1, +2, 0], [+1, -2, -1, +1], [-2, 0, -2, +1], [+2, +1, +1, -1]],
  q2: [[-1, +2, +2, -1], [-2, +1, -1, +1], [-1, -2, -1, 0], [+2, +1, +1, +1]],
  q4: [[0, -2, -2, 0], [-1, +1, -1, +2], [-1, +1, +2, -2], [+1, +2, +1, +1]],
  q5: [[-1, -1, -2, -1], [-1, +1, +2, -1], [+1, 0, -1, +1], [0, -1, -2, +1]]
}
const ONBOARDING_MAP = {
  IRD: ['owl', 'snake'],
  IRC: 'mouse',
  IFD: ['fish', 'cat'],
  IFC: 'rabbit',
  ERD: 'fox',
  ERC: 'wolf',
  EFD: 'frog',
  EFC: 'dog'
}
const ONBOARDING_ANIMALS = {
  owl: { name: '猫头鹰', kw: '洞察 · 安静 · 慢说', desc: '你的沉默不是空的。\n里面装着的，比大多数人说出口的都多。', msg: '你说话之前，已经在心里过了三遍。\n别人以为你慢，其实你看得比谁都清楚。\n不急，我等你想好再说。' },
  snake: { name: '小蛇', kw: '静观 · 精准 · 不动声色', desc: '你从不浪费一句话。\n等你开口的那一刻，全世界都该安静。', msg: '你不出声的时候，比谁都看得准。\n这种精准让人安心，也让人有点怕你。\n没关系，我不怕。' },
  mouse: { name: '小鼠', kw: '谨慎 · 细致 · 备好一切', desc: '那些被所有人忽略的角落，\n你看见了，而且悄悄照亮了。', msg: '你默默备好了一切。\n别人没注意到的细节，你全看见了。\n这份周全，我记住了。' },
  fish: { name: '小鱼', kw: '自由 · 不抓 · 随心', desc: '你天生知道什么时候该留、什么时候该走。\n这件事，大多数人一辈子学不会。', msg: '你天生不被绑住。\n心情来了游过去，不来了游开。\n这种自由，很多人学不会。' },
  cat: { name: '猫', kw: '自我 · 选择性靠近 · 边界清', desc: '你的靠近是一份礼物。\n不是谁都配拆开的。', msg: '你不轻易靠近。\n但靠近了就是偏爱。\n能被你选中的人，应该知道这有多难得。' },
  rabbit: { name: '小兔', kw: '敏感 · 温柔 · 心思重', desc: '你的柔软是一种勇敢。\n敢被世界碰疼，还敢先伸出手。', msg: '你心思很重，容易被一句话扎到。\n但你给出去的温柔，\n是最快让人放下防备的那种。' },
  fox: { name: '狐狸', kw: '机敏 · 读空气 · 进退有度', desc: '你一秒看穿三层意思。\n只是偶尔，也允许自己看不透。', msg: '你脑子转得太快了。\n三层意思一秒读完。\n只是偶尔，别绕进自己的局里。' },
  wolf: { name: '狼', kw: '深情 · 有原则 · 慢热', desc: '你的深情藏在原则里。\n被你认定的人，拥有了一座不会塌的山。', msg: '你不轻易跟随，也不轻易喜欢。\n但你一旦认定，底牌全掏出来。\n这种人，很少了。' },
  frog: { name: '青蛙', kw: '不内耗 · 时机感 · 突然出动', desc: '所有人还在想要不要动的时候，\n你已经跳了。', msg: '你看着躺平，时机一到就跳。\n别人还在想要不要动，\n你已经在水里了。' },
  dog: { name: '小狗', kw: '热烈 · 真诚 · 直接', desc: '你从不把喜欢藏起来。\n这世上最稀缺的不是聪明，是你这种真。', msg: '你的喜欢从来不藏着。\n赢过真心，也摔得痛过。\n但你好像从没想过收手——这很厉害。' }
}
const PLANET_PERSONALITY_MAP = {
  love: { key: 'cat', animal: 'Cat', trait: 'selective closeness · clear boundaries' },
  work: { key: 'owl', animal: 'Owl', trait: 'quiet insight · slow thinking · precise timing' },
  self: { key: 'fish', animal: 'Fish', trait: 'fluid attention · freedom without being held' },
  family: { key: 'rabbit', animal: 'Rabbit', trait: 'soft sensitivity · careful emotional reading' }
}
const ABOUT_ANIMAL_PROFILE = {
  fox: {
    name: 'Fox',
    trait: 'quick read · social nuance · measured distance',
    line: 'You read three layers of meaning in one second. Just remember: sometimes you are allowed not to solve the room.'
  }
}
const BIRD_DAILY_NOTES = [
  {
    id: 'note-1',
    date: 'Today',
    title: 'Quiet Proof',
    text: 'Today you moved between wanting closeness and wanting quiet. That is not contradiction; it is your system asking for proof before it relaxes. When the room feels uncertain, you start reading tiny signals. I would not call that overthinking. I would call it a need for steadier evidence.'
  },
  {
    id: 'note-2',
    date: 'Yesterday',
    title: 'Third Sentence Truth',
    text: 'You seem softer after you write things down. The first sentence is usually defensive, but by the third one you begin telling the truth. There is a pattern here: you do not need faster answers as much as you need a place where the answer can arrive without being rushed.'
  }
]
const ONBOARDING_QUESTIONS = {
  q1: { label: '1 / 7', text: <>你在一段熟悉的关系里，<br />更接近哪个？</>, options: ['听的人——对方说，我接住', '带节奏的人——去哪吃什么我来安排', '偶尔消失的人——突然就想自己待一会儿', '主动的人——我不找，怕就断了'] },
  q2: { label: '2 / 7', text: <>深夜 emo 的时候，<br />你更可能在干嘛？</>, options: ['反复刷某个人的朋友圈或聊天记录', '裹在被子里发呆，或者哭一场', '打开备忘录写点什么，把脑子理一理', '找个人说话，或刷点搞笑视频别再想了'] },
  q4: { label: '4 / 7', text: <>心里闷闷的、又说不清到底怎么了的时候，<br />你一般？</>, options: ['找点事做——忙起来就顾不上想了', '什么都不干，允许自己瘫一天', '在脑子里翻来覆去想，想找到那个“点”', '想跟人待着，哪怕不聊这件事'] },
  q5: { label: '5 / 7', text: '你最近最常对自己说的一句话是？', options: ['“再忍忍就好了”', '“我又想多了”', '“去他的，不管了”', '“不可控的，放一边”'] }
}
export const readOnboardingProfile = () => {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.localStorage.getItem(CHIRP_PROFILE_KEY) || 'null')
  } catch {
    return null
  }
}

const saveOnboardingProfile = (profile) => {
  window.localStorage.setItem(CHIRP_PROFILE_KEY, JSON.stringify(profile))
  window.dispatchEvent(new CustomEvent('chirp:onboarding-updated', { detail: profile }))
}

const calculateOnboardingAnimal = (answers) => {
  let ie = 0
  let rf = 0
  let dc = 0
  let ts = 0
  ;['q1', 'q2', 'q4', 'q5'].forEach(q => {
    if (answers[q] !== undefined) {
      const score = ONBOARDING_SCORES[q][answers[q]]
      ie += score[0]
      rf += score[1]
      dc += score[2]
      ts += score[3]
    }
  })
  const key = `${ie > 0 ? 'E' : 'I'}${rf > 0 ? 'F' : 'R'}${dc > 0 ? 'C' : 'D'}`
  const mapped = ONBOARDING_MAP[key]
  return Array.isArray(mapped) ? (ts > 0 ? mapped[0] : mapped[1]) : mapped
}

const OnboardingBird = () => <HomeBird />

export const OnboardingAnimalAvatar = ({ animal = 'cat' }) => {
  return <img src={`/chirp/animal-icons/${animal}.svg`} alt="" />
}

const PaletteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 22 C7 22 3 18.2 3 13.4 C3 8.1 7.3 4 12.8 4 C17.8 4 21 7.1 21 10.8 C21 13.1 19.5 14.5 17.8 14.5 H16.2 C15 14.5 14.2 15.5 14.6 16.7 L14.9 17.5 C15.7 20 14.3 22 12 22 Z" />
  </svg>
)

const truncateWords = (text, limit = 32) => {
  const words = text.trim().split(/\s+/)
  if (words.length <= limit) return text
  return `${words.slice(0, limit).join(' ')}...`
}

function ChirpHomePage({ page, id }) {
  const { user } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('menu')
  const [drawerWidth, setDrawerWidth] = useState(DRAWER_DEFAULT_WIDTH)
  const [planetActivity, setPlanetActivity] = useState(() => readPlanetActivity())
  const [planets, setPlanets] = useState(() => getAllPlanets())
  const [personas, setPersonas] = useState(() => getAllPersonas())
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [chirpProfile, setChirpProfile] = useState(() => readOnboardingProfile())
  const selectedPlanet = useMemo(() => {
    if (page !== 'planet') return null
    return planets.find(planet => planet.id === id || planet.dbId === id) || getPlanetById(id)
  }, [page, id, planets])

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
    const refreshPlanets = () => {
      if (!user) {
        setPlanets(getAllPlanets())
        return
      }
      loadChirpPlanets(user)
        .then(setPlanets)
        .catch(error => console.warn('Failed to refresh Chirp planets:', error))
    }
    const refreshPersonas = () => setPersonas(getAllPersonas())
    const refreshOnboarding = () => setChirpProfile(readOnboardingProfile())
    const openOnboarding = () => setOnboardingOpen(true)

    window.addEventListener('chirp:open-menu', openMenu)
    window.addEventListener('chirp:open-onboarding', openOnboarding)
    window.addEventListener('chirp:planet-activity', refreshActivity)
    window.addEventListener('chirp:planet-meta-updated', refreshPlanets)
    window.addEventListener('chirp:personas-updated', refreshPersonas)
    window.addEventListener('chirp:onboarding-updated', refreshOnboarding)
    window.addEventListener('storage', refreshActivity)
    window.addEventListener('storage', refreshPlanets)
    return () => {
      window.removeEventListener('chirp:open-menu', openMenu)
      window.removeEventListener('chirp:open-onboarding', openOnboarding)
      window.removeEventListener('chirp:planet-activity', refreshActivity)
      window.removeEventListener('chirp:planet-meta-updated', refreshPlanets)
      window.removeEventListener('chirp:personas-updated', refreshPersonas)
      window.removeEventListener('chirp:onboarding-updated', refreshOnboarding)
      window.removeEventListener('storage', refreshActivity)
      window.removeEventListener('storage', refreshPlanets)
    }
  }, [user])

  useEffect(() => {
    let cancelled = false

    const loadRemoteChirp = async () => {
      if (!user) return
      try {
        const [remoteProfile, remotePlanets, remoteCustomPersonas] = await Promise.all([
          loadChirpProfile(user),
          loadChirpPlanets(user),
          loadCustomPersonas(user)
        ])
        if (cancelled) return
        if (remoteProfile) {
          saveOnboardingProfile(remoteProfile)
          setChirpProfile(remoteProfile)
        }
        setPlanets(remotePlanets)
        setPersonas([...getAllPersonas(), ...remoteCustomPersonas])
        const remoteActivity = await loadPlanetActivityFromMessages(remotePlanets)
        if (!cancelled) setPlanetActivity(remoteActivity)
      } catch (error) {
        console.warn('Failed to load Chirp from Supabase:', error)
      }
    }

    loadRemoteChirp()
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (page || chirpProfile) return
    setOnboardingOpen(true)
  }, [page, chirpProfile])

  const completeOnboarding = async (profile) => {
    saveOnboardingProfile(profile)
    setChirpProfile(profile)
    if (user) {
      try {
        await saveChirpProfile(user, profile)
      } catch (error) {
        console.warn('Failed to save Chirp profile:', error)
      }
    }
    setOnboardingOpen(false)
    navigateTo('chirp')
  }

  if (selectedPlanet) {
    return (
      <div className="chirp-home-detail">
        <ChirpPage planetConfig={selectedPlanet} onBack={openPlanetDrawer} />
        <SideDrawer open={drawerOpen} mode={drawerMode} setMode={setDrawerMode} onClose={() => setDrawerOpen(false)} recentFor={recentFor} planets={planets} drawerWidth={drawerWidth} onResizeStart={startDrawerResize} />
        {onboardingOpen && <ChirpOnboarding onComplete={completeOnboarding} />}
      </div>
    )
  }

  if (page === 'persona') {
    return (
      <div className="chirp-home-page">
        <PersonaPage personas={personas} planets={planets} user={user} onPersonasChange={async () => {
          const remoteCustomPersonas = user ? await loadCustomPersonas(user).catch(() => []) : []
          setPersonas([...getAllPersonas(), ...remoteCustomPersonas])
        }} />
        <SideDrawer open={drawerOpen} mode={drawerMode} setMode={setDrawerMode} onClose={() => setDrawerOpen(false)} recentFor={recentFor} planets={planets} drawerWidth={drawerWidth} onResizeStart={startDrawerResize} />
        {onboardingOpen && <ChirpOnboarding onComplete={completeOnboarding} />}
      </div>
    )
  }

  if (page === 'about-me') {
    return (
      <div className="chirp-home-page">
        <AboutMePage chirpProfile={chirpProfile} planets={planets} />
        {onboardingOpen && <ChirpOnboarding onComplete={completeOnboarding} />}
      </div>
    )
  }

  if (page === 'moments') {
    return (
      <div className="chirp-home-page">
        <main className="chirp-about-placeholder">
          <div className="sec-label">Moments</div>
        </main>
        {onboardingOpen && <ChirpOnboarding onComplete={completeOnboarding} />}
      </div>
    )
  }

  return (
    <div className="chirp-home-page">
      <main className="content">
        <div className="chirp-hero-row">
          <div className="bird-strip">
            <div className="bird-avatar"><HomeBird /></div>
            <div className="bird-text">
              <div className="bird-name">{chirpProfile?.birdName || 'Bird'} · 07:42</div>
              <div className="bird-msg">
                Morning, Goldie — last night in <em role="button" tabIndex="0" onClick={() => navigateTo('chirp', 'planet', 'love')} onKeyDown={(event) => event.key === 'Enter' && navigateTo('chirp', 'planet', 'love')}>Crush with...</em> you wrote "never mind, let it go." That softness shows up a lot this week.
              </div>
            </div>
            <button className="chirp-test-button" type="button" onClick={() => setOnboardingOpen(true)}>Chat</button>
          </div>
        </div>

        <div className="sec-label">My Planets</div>
        <div className="planets-grid">
          {planets.map((planet) => (
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

      <SideDrawer open={drawerOpen} mode={drawerMode} setMode={setDrawerMode} onClose={() => setDrawerOpen(false)} recentFor={recentFor} planets={planets} drawerWidth={drawerWidth} onResizeStart={startDrawerResize} />
      {onboardingOpen && <ChirpOnboarding onComplete={completeOnboarding} />}
    </div>
  )
}

function AboutMePage({ chirpProfile, planets }) {
  const [expandedNoteId, setExpandedNoteId] = useState(null)
  const animalKey = 'fox'
  const animal = ABOUT_ANIMAL_PROFILE[animalKey]
  const birdName = chirpProfile?.birdName && chirpProfile.birdName !== 'Bird' ? chirpProfile.birdName : '小草'

  return (
    <main className="chirp-about-page">
      <section className="chirp-about-profile">
        <div className="about-profile-head">
          <div className="about-profile-avatar">
            <OnboardingAnimalAvatar animal={animalKey} />
          </div>
          <div className="about-profile-copy">
            <div className="sec-label">About Me</div>
            <h1>{animal.name}</h1>
            <div className="about-profile-traits">{animal.trait}</div>
          </div>
        </div>
        <div className="about-profile-line">
          <p>{animal.line}</p>
        </div>
      </section>

      <section className="chirp-about-insights">
        <div className="about-section-head">
          <div>
            <div className="sec-label">{birdName}'s Planet Findings</div>
          </div>
        </div>

        <div className="about-planet-types">
          {planets.map(planet => {
            const personality = PLANET_PERSONALITY_MAP[planet.id] || { key: 'fox', animal: 'Fox', trait: 'quick read · social nuance · measured distance' }
            return (
              <article className="about-planet-type" key={planet.id} style={{ '--planet-color': planet.color }}>
                <span>{getPlanetCardTitle(planet)}</span>
                <div className="about-planet-animal">
                  <span className="about-planet-animal-avatar">
                    <OnboardingAnimalAvatar animal={personality.key} />
                  </span>
                  <strong>{personality.animal}</strong>
                </div>
                <p>{personality.trait}</p>
              </article>
            )
          })}
        </div>

        <div className="about-notes-block">
          <div className="about-section-head compact">
            <div>
              <div className="sec-label">{birdName} Notes</div>
            </div>
          </div>
          <div className="about-notes-list">
            {BIRD_DAILY_NOTES.map(note => {
              const expanded = expandedNoteId === note.id
              return (
                <button className={`about-note ${expanded ? 'expanded' : ''}`} type="button" key={note.id} onClick={() => setExpandedNoteId(expanded ? null : note.id)}>
                  <div className="about-note-meta">
                    <span>{note.date}</span>
                    <strong>{note.title}</strong>
                  </div>
                  <p>{expanded ? note.text : truncateWords(note.text, 28)}</p>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

function ChirpOnboarding({ onComplete }) {
  const [screen, setScreen] = useState('intro')
  const [answers, setAnswers] = useState({})
  const [mbti, setMbti] = useState('')
  const [mbtiSkipped, setMbtiSkipped] = useState(false)
  const [thing, setThing] = useState('')
  const [birdName, setBirdName] = useState('')
  const [resultAnimal, setResultAnimal] = useState(null)

  const qIndex = ONBOARDING_FLOW.indexOf(screen)
  const progress = qIndex >= 0 ? `${((qIndex + 1) / ONBOARDING_FLOW.length) * 100}%` : '0%'
  const isQuestion = qIndex >= 0
  const result = resultAnimal ? ONBOARDING_ANIMALS[resultAnimal] : null

  const canGoNext = () => {
    if (['q1', 'q2', 'q4', 'q5'].includes(screen)) return answers[screen] !== undefined
    if (screen === 'q3') return mbtiSkipped || /^[EI][SN][TF][JP]$/i.test(mbti.trim())
    if (screen === 'q6') return thing.trim()
    if (screen === 'q7') return birdName.trim()
    return true
  }

  const goNext = () => {
    const index = ONBOARDING_FLOW.indexOf(screen)
    if (index < ONBOARDING_FLOW.length - 1) {
      setScreen(ONBOARDING_FLOW[index + 1])
      return
    }
    setScreen('loading')
    window.setTimeout(() => {
      const animal = calculateOnboardingAnimal(answers)
      setResultAnimal(animal)
      setScreen('result')
    }, 2200)
  }

  const goBack = () => {
    const index = ONBOARDING_FLOW.indexOf(screen)
    setScreen(index <= 0 ? 'intro' : ONBOARDING_FLOW[index - 1])
  }

  const finish = () => {
    const animal = resultAnimal || calculateOnboardingAnimal(answers)
    onComplete({
      animal,
      animalName: ONBOARDING_ANIMALS[animal]?.name || '猫',
      birdName: birdName.trim() || 'bird',
      mbti: mbtiSkipped ? null : mbti.trim().toUpperCase(),
      focus: thing.trim(),
      completedAt: Date.now()
    })
  }

  return (
    <div className="chirp-onboarding">
      <div className={`chirp-onboarding-progress ${isQuestion ? 'show' : ''}`}>
        <div style={{ width: progress }} />
      </div>

      <section className={`chirp-ob-screen ${screen === 'intro' ? 'active' : ''}`}>
        <div className="chirp-ob-bird"><OnboardingBird /></div>
        <div className="chirp-ob-greeting chirp-ob-intro-copy">
          在你开始之前，<br />
          能让我先认识你一下吗？<br />
          几个小问题，很快的。
        </div>
        <button className="chirp-ob-primary" type="button" onClick={() => setScreen('q1')}>好啊</button>
      </section>

      {['q1', 'q2', 'q4', 'q5'].map(qId => {
        const q = ONBOARDING_QUESTIONS[qId]
        return (
          <section className={`chirp-ob-screen ${screen === qId ? 'active' : ''}`} key={qId}>
            <div className="chirp-ob-q-label">{q.label}</div>
            <div className="chirp-ob-q-text">{q.text}</div>
            <div className="chirp-ob-options">
              {q.options.map((option, index) => (
                <button className={`chirp-ob-option ${answers[qId] === index ? 'selected' : ''}`} type="button" key={option} onClick={() => setAnswers(prev => ({ ...prev, [qId]: index }))}>
                  {option}
                </button>
              ))}
            </div>
          </section>
        )
      })}

      <section className={`chirp-ob-screen ${screen === 'q3' ? 'active' : ''}`}>
        <div className="chirp-ob-q-label">3 / 7</div>
        <div className="chirp-ob-q-text">你的 MBTI 是？</div>
        <div className="chirp-ob-input-wrap">
          <input className="chirp-ob-input chirp-ob-mbti" value={mbti} maxLength="4" onChange={(event) => { setMbti(event.target.value.toUpperCase()); setMbtiSkipped(false) }} autoComplete="off" spellCheck="false" />
          <div className="chirp-ob-input-hint">{mbti.length >= 4 && !/^[EI][SN][TF][JP]$/i.test(mbti) ? '格式不太对，试试像 INFJ 这样。' : ''}</div>
        </div>
        <div className="chirp-ob-options skip">
          <button className={`chirp-ob-option ${mbtiSkipped ? 'selected' : ''}`} type="button" onClick={() => { setMbti(''); setMbtiSkipped(true) }}>没测过</button>
        </div>
      </section>

      <section className={`chirp-ob-screen ${screen === 'q6' ? 'active' : ''}`}>
        <div className="chirp-ob-q-label">6 / 7</div>
        <div className="chirp-ob-q-text">最近占满你脑子的两件事是？</div>
        <div className="chirp-ob-input-wrap">
          <input className="chirp-ob-input" value={thing} onChange={(event) => setThing(event.target.value)} />
          <div className="chirp-ob-input-hint">关键词就行，比如“跳槽、和他的关系”</div>
        </div>
      </section>

      <section className={`chirp-ob-screen ${screen === 'q7' ? 'active' : ''}`}>
        <div className="chirp-ob-q-label">7 / 7</div>
        <div className="chirp-ob-q-text">最后！<br />为我取个帅翻宇宙的名字吧——<br />以后我就只认你叫的这个了</div>
        <div className="chirp-ob-input-wrap">
          <input className="chirp-ob-input chirp-ob-name-input" value={birdName} onChange={(event) => setBirdName(event.target.value)} autoComplete="off" />
        </div>
      </section>

      <section className={`chirp-ob-screen ${screen === 'loading' ? 'active' : ''}`}>
        <div className="chirp-ob-bird"><OnboardingBird /></div>
        <div className="chirp-ob-loading">chirp 观察中...</div>
      </section>

      <section className={`chirp-ob-screen ${screen === 'result' ? 'active' : ''}`}>
        <div className="chirp-ob-result-avatar"><OnboardingAnimalAvatar animal={resultAnimal} /></div>
        <div className="chirp-ob-result-label">你是</div>
        <div className="chirp-ob-result-animal">{result?.name}</div>
        <div className="chirp-ob-result-keywords">{result?.kw}</div>
        <div className="chirp-ob-result-msg">{result?.msg}</div>
        <div className="chirp-ob-result-sig">— 来自{birdName || 'bird'}</div>
        <button className="chirp-ob-primary" type="button" onClick={finish}>继续 →</button>
      </section>

      {isQuestion && (
        <div className="chirp-ob-nav">
          <button className={`chirp-ob-back ${screen === 'q1' ? 'hidden' : ''}`} type="button" onClick={goBack}>← 上一题</button>
          <button className={`chirp-ob-next ${canGoNext() ? '' : 'disabled'}`} type="button" onClick={goNext}>{screen === 'q7' ? '就这个了 ✓' : '下一题 →'}</button>
        </div>
      )}
    </div>
  )
}

function PlanetCard({ planet, recent }) {
  const Art = planetArt[planet.id] || LoveCat
  const className = planet.id === 'work' ? 'pc-work' : 'pc-love'

  return (
    <button className={`planet-card ${className}`} type="button" onClick={() => navigateTo('chirp', 'planet', planet.id)}>
      <div className="pc-avatar"><Art /></div>
      <div className="pc-name">{getPlanetCardTitle(planet)}</div>
      <div className="pc-quote">{recent.text}</div>
      <time className="pc-time">{recent.time}</time>
    </button>
  )
}

function PersonaPage({ personas, planets, user, onPersonasChange }) {
  const [creatorOpen, setCreatorOpen] = useState(false)
  const [usePersona, setUsePersona] = useState(null)
  const [toast, setToast] = useState('')
  const [customColor, setCustomColor] = useState(DEFAULT_PERSONA_COLOR)
  const [draft, setDraft] = useState({
    name: '',
    role: '',
    description: '',
    systemPrompt: '',
    skills: '',
    avatarUrl: '',
    avatarFile: null,
    color: DEFAULT_PERSONA_COLOR
  })

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('Avatar must be under 3MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const avatarUrl = reader.result
      const color = await extractDominantColor(avatarUrl)
      setDraft(prev => ({ ...prev, avatarFile: file, avatarUrl, color }))
    }
    reader.readAsDataURL(file)
  }

  const createPersona = async () => {
    const name = draft.name.trim()
    const systemPrompt = draft.systemPrompt.trim()
    if (!name || !systemPrompt) {
      showToast('Name and system prompt are required.')
      return
    }

    let uploadedAvatarUrl = ''
    if (user && draft.avatarFile) {
      try {
        uploadedAvatarUrl = await uploadPersonaAvatar(user, draft.avatarFile)
      } catch (error) {
        console.warn('Failed to upload persona avatar:', error)
        showToast('Avatar upload failed. Persona saved without image.')
      }
    }

    const persona = {
      id: `custom-${Date.now()}`,
      name,
      role: draft.role.trim() || 'custom persona',
      description: draft.description.trim() || 'A custom persona created by you for private Planet conversations.',
      systemPrompt,
      skills: draft.skills.trim(),
      avatarUrl: uploadedAvatarUrl || (!user ? draft.avatarUrl : ''),
      color: draft.color || '#F5C878',
      theme: buildPersonaTheme(draft.color || '#F5C878'),
      pricing: 'free',
      usageCount: 0,
      createdAt: Date.now()
    }
    if (user) {
      try {
        await saveCustomPersonaToSupabase(user, persona)
      } catch (error) {
        console.warn('Failed to save persona to Supabase:', error)
        saveCustomPersona(persona)
      }
    } else {
      saveCustomPersona(persona)
    }
    setDraft({ name: '', role: '', description: '', systemPrompt: '', skills: '', avatarUrl: '', avatarFile: null, color: DEFAULT_PERSONA_COLOR })
    setCreatorOpen(false)
    onPersonasChange()
    showToast('Persona created.')
  }

  const attachPersona = async (planet, persona) => {
    addPersonaToPlanet(planet.id, persona.id)
    if (planet.dbId) {
      try {
        const existing = await loadPlanetMemberPersonas(planet, getAllPersonas(), personas)
        const next = existing.some(member => member.id === persona.id) ? existing : [...existing, persona]
        await savePlanetMemberPersonas(planet, next)
      } catch (error) {
        console.warn('Failed to save persona to Planet:', error)
      }
    }
    setUsePersona(null)
    showToast(`${persona.name} added to ${planet.roomName}.`)
  }

  return (
    <main className="chirp-persona-page">
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
            <div className="persona-modal-top-row">
              <label className="persona-avatar-picker" style={{ '--draft-avatar-bg': draft.color }}>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                {draft.avatarUrl ? (
                  <img src={draft.avatarUrl} alt="" />
                ) : (
                  <span>{getPersonaAvatarLabel(draft.name)}</span>
                )}
                <em>上传图片设置头像</em>
              </label>
              <div className="persona-color-palette" aria-label="Choose avatar color">
                {PERSONA_AVATAR_COLORS.map(color => (
                  <button
                    className={draft.color === color ? 'active' : ''}
                    type="button"
                    key={color}
                    style={{ backgroundColor: color }}
                    aria-label={`Use color ${color}`}
                    onClick={() => setDraft(prev => ({ ...prev, color }))}
                  />
                ))}
                <label className={`persona-custom-color ${!PERSONA_AVATAR_COLORS.includes(draft.color) ? 'active' : ''}`}>
                  <input
                    type="color"
                    value={customColor}
                    aria-label="Choose custom avatar color"
                    onChange={(event) => {
                      setCustomColor(event.target.value)
                      setDraft(prev => ({ ...prev, color: event.target.value }))
                    }}
                  />
                  <span><PaletteIcon /></span>
                </label>
              </div>
            </div>
            <label className="persona-name-field">
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
            <button className="persona-primary" type="button" onClick={createPersona}>Create</button>
          </section>
        </div>
      )}

      {usePersona && (
        <div className="persona-modal-layer">
          <section className="persona-use-panel">
            <button className="persona-modal-close" type="button" onClick={() => setUsePersona(null)}>×</button>
            <h2>Add to Planet</h2>
            {planets.map(planet => {
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
            <div className="pc-name">{truncateTitle(getPlanetCardTitle(planet), 4)}</div>
            <time className="pc-time">{recent.time}</time>
          </div>
          <div className="pc-quote">{recent.rawText || recent.text}</div>
        </div>
      </div>
    </button>
  )
}

function SideDrawer({ open, mode, setMode, onClose, recentFor, planets, drawerWidth, onResizeStart }) {
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
            {planets.map(planet => (
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
          <span className="chirp-drawer-bird-avatar"><HomeBird /></span>
          <strong>Bird</strong>
          <button type="button">Chat</button>
        </div>
        <button className="chirp-home-drawer-resize" type="button" aria-label="Resize sidebar" onMouseDown={onResizeStart} />
      </aside>
    </>
  )
}

export default ChirpHomePage

