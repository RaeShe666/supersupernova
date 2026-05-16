import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ChirpPage from './ChirpPage'
import {
  addPersonaToPlanet,
  BIRD,
  buildPersonaTheme,
  CHIRP_PLANETS,
  formatActivityTime,
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
  loadChirpMomentEntries,
  loadCustomPersonas,
  loadPlanetActivityFromMessages,
  loadPlanetMemberPersonas,
  saveChirpProfile,
  saveChirpMomentEntry,
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

const getCardTitle = (planet) => (planet.id === 'work' ? 'the suck odessy' : 'my crush...')
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
        <MomentsPage user={user} planets={planets} />
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
                Morning, Goldie — last night in <em role="button" tabIndex="0" onClick={() => navigateTo('chirp', 'planet', 'love')} onKeyDown={(event) => event.key === 'Enter' && navigateTo('chirp', 'planet', 'love')}>my crush...</em> you wrote "never mind, let it go." That softness shows up a lot this week.
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

const buildMomentMonth = (days, marked) => Array.from({ length: days }, (_, index) => marked[index + 1] || 'none')
const MOMENTS_CAL_DATA = {
  may: buildMomentMonth(31, { 10: 'blue', 12: 'duo', 13: 'gold', 14: 'duo' }),
  apr: buildMomentMonth(30, { 3: 'blue', 8: 'duo', 15: 'gold', 24: 'blue' }),
  mar: buildMomentMonth(31, { 18: 'gold', 19: 'duo', 21: 'blue' })
}

const MOMENTS_DATE_TARGETS = {
  may: { 14: 'today', 13: 'yesterday', 12: 'may-12', 10: 'may-10' },
  apr: { 3: 'apr-3', 8: 'apr-8', 15: 'apr-15', 24: 'apr-24' },
  mar: { 18: 'mar-18', 19: 'mar-19', 21: 'mar-21' }
}

const MOMENTS_PAPER_COLORS = ['#FAFAF7', '#FFF8E7', '#F0F4E8', '#E8F0F5', '#FBE6EA', '#EFEAF8', '#FFFFFF']
const MOMENTS_PAPER_PATTERNS = [
  { id: '', name: 'Plain', preview: 'blank-p' },
  { id: 'pattern-grid', name: 'Grid', preview: 'grid-p' },
  { id: 'pattern-lined', name: 'Lined', preview: 'lined-p' },
  { id: 'pattern-dot', name: 'Dotted', preview: 'dot-p' }
]

const MOMENT_SPACES = [
  {
    id: 'xw',
    backingId: 'love',
    className: 'love',
    title: 'X & W',
    subtitle: 'SHARED'
  },
  {
    id: 'inner-child',
    backingId: 'work',
    className: 'work',
    title: 'the inner child',
    subtitle: 'PRIVATE'
  }
]

const MOMENT_SAMPLE_ENTRIES = {
  xw: [
    { id: 'sample-xw-1', dateKey: 'today', dateLabel: 'Today', time: '15 : 08 · W', tone: 'fr', text: '中午那个汤！！好喝到原地升天，下次一起去', image: 'soup', imageText: '🍲 那家小店' },
    { id: 'sample-xw-2', dateKey: 'today', dateLabel: 'Today', time: '14 : 22 · X', tone: 'me', text: '路过咖啡店，门口的猫又在晒太阳。跟你说过的那只。', image: 'cat', imageText: '🐱 cat in the sun' },
    { id: 'sample-xw-3', dateKey: 'yesterday', dateLabel: 'Yesterday', time: '10 : 30 · W', tone: 'fr', text: '早上阳光洒进来，突然很想发条消息给你。又忍住了。' },
    { id: 'sample-xw-4', dateKey: 'may-12', dateLabel: 'May 12', time: '09 : 15 · X', tone: 'me', text: '今天天气好得不真实' },
    { id: 'sample-xw-5', dateKey: 'may-10', dateLabel: 'May 10', time: '18 : 45 · W', tone: 'fr', text: '公园里有人在放风筝。线断了，风筝越飞越远。莫名觉得自由。' }
  ],
  'inner-child': [
    { id: 'sample-inner-1', dateKey: 'today', dateLabel: 'Today', time: '16 : 12 · S', tone: 'me', text: '刚刚买到最后一只草莓面包，像被今天偷偷偏爱了一下。' },
    { id: 'sample-inner-2', dateKey: 'today', dateLabel: 'Today', time: '13 : 27 · S', tone: 'me', text: '灵机一现：下次写东西可以先写标题，别急着证明自己很完整。' },
    { id: 'sample-inner-3', dateKey: 'yesterday', dateLabel: 'Yesterday', time: '09 : 48 · S', tone: 'me', text: '碎碎念：今天的云像被揉皱的纸巾，但看着很安心。' },
    { id: 'sample-inner-4', dateKey: 'may-12', dateLabel: 'May 12', time: '12 : 15 · S', tone: 'me', text: '午饭吃了碗特别好吃的牛肉面。幸福就是这么简单。' },
    { id: 'sample-inner-5', dateKey: 'may-10', dateLabel: 'May 10', time: '21 : 08 · S', tone: 'me', text: '看完动画片莫名想哭。是被那种“很简单的好”打到了。' }
  ]
}

const MOMENTS_BIRD_PROMPT = {
  id: 'bird-inner-child-prompt',
  dateKey: 'today',
  dateLabel: 'Today',
  time: '小草 · now',
  tone: 'bird',
  text: '我会在这里陪你把零散的感受慢慢写清楚。你不用组织好再说，我会先问很简单的问题：你今天心情如何？'
}

const readLocalMomentEntries = (planetId) => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(`chirpMoments:${planetId}`) || '[]')
  } catch {
    return []
  }
}

const saveLocalMomentEntries = (planetId, entries) => {
  window.localStorage.setItem(`chirpMoments:${planetId}`, JSON.stringify(entries))
}

const MomentsPaperclipIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16.5 6.6 C16.1 6.2 15.4 6.1 14.9 6.5 C14.6 6.7 14.4 7 14.1 7.3 L8.3 13.2 C7.6 13.9 7.4 14.7 8 15.2 C8.6 15.7 9.4 15.4 10 14.8 L14.7 10 C14.9 9.8 15 9.6 15.2 9.5" />
    <path d="M17.6 5.5 C16.5 4.5 14.8 4.4 13.7 5.5 L7.2 12 C5.4 13.8 5.3 16.7 7 18.4 C8.7 20.1 11.5 20 13.4 18.2 L18.7 12.9 C18.9 12.6 19.2 12.4 19.4 12.1" />
  </svg>
)

const MomentsMicIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.3 C10.4 3.2 9.5 4.2 9.5 5.6 C9.5 7.4 9.5 9.3 9.5 11 C9.4 12.6 10.6 13.6 12.1 13.5 C13.6 13.4 14.5 12.4 14.5 11 C14.5 9.2 14.5 7.2 14.5 5.6 C14.5 4.1 13.6 3.2 12 3.3 Z" />
    <path d="M6.6 11 C6.4 14.7 9.3 16.6 12 16.5 C15.1 16.4 17.6 14.5 17.5 11.2" />
    <path d="M12 16.5 C12 17.7 12 18.7 12 20" />
    <path d="M8.8 20.1 C10.7 20 13.2 20 15.3 20" />
  </svg>
)

function MomentsCalendarDay({ kind, day, today, onOpen }) {
  const hasEntry = kind !== 'none'
  return (
    <button className={`moments-dd ${hasEntry ? 'has' : ''} ${today ? 'today-ring' : ''}`} type="button" onClick={hasEntry ? onOpen : undefined}>
      {kind === 'gold' && <span className="moments-ex-av gold">S</span>}
      {kind === 'blue' && <span className="moments-ex-av blue">X</span>}
      {kind === 'duo' && (
        <span className="moments-ex-duo">
          <span className="moments-ex-av small gold">S</span>
          <span className="moments-ex-av small blue">X</span>
        </span>
      )}
      {kind === 'none' && <span className="moments-dd-dot" />}
    </button>
  )
}

function MomentsPage({ user, planets }) {
  const [aiMode, setAiMode] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [bgPickerOpen, setBgPickerOpen] = useState(false)
  const [paperColor, setPaperColor] = useState('#FAFAF7')
  const [paperPattern, setPaperPattern] = useState('')
  const [activeMomentId, setActiveMomentId] = useState('xw')
  const [momentEntries, setMomentEntries] = useState([])
  const [draftText, setDraftText] = useState('')
  const [composerActive, setComposerActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [draftEntryId, setDraftEntryId] = useState(null)

  const activeMoment = useMemo(() => {
    return MOMENT_SPACES.find(space => space.id === activeMomentId) || MOMENT_SPACES[0]
  }, [activeMomentId])

  const backingPlanet = useMemo(() => {
    return planets.find(planet => planet.id === activeMoment.backingId) || getPlanetById(activeMoment.backingId) || planets[0]
  }, [activeMoment, planets])

  useEffect(() => {
    let cancelled = false
    const loadEntries = async () => {
      const localEntries = readLocalMomentEntries(activeMomentId)
      if (!user || !backingPlanet?.dbId) {
        setMomentEntries(localEntries)
        setDraftText('')
        setDraftEntryId(null)
        return
      }
      try {
        const remoteEntries = await loadChirpMomentEntries(backingPlanet)
        const entries = remoteEntries?.length ? remoteEntries : localEntries
        if (!cancelled) {
          setMomentEntries(entries)
          setDraftText('')
          setDraftEntryId(null)
        }
      } catch (error) {
        console.warn('Failed to load Moments entries:', error)
        if (!cancelled) {
          setMomentEntries(localEntries)
          setDraftText('')
          setDraftEntryId(null)
        }
      }
    }

    loadEntries()
    return () => {
      cancelled = true
    }
  }, [activeMomentId, backingPlanet, user])

  const saveMomentDraft = async (textOverride = draftText) => {
    const text = textOverride.trim()
    if (!text || saving) return
    setSaving(true)
    const localEntry = { id: draftEntryId || `local-${Date.now()}`, text, createdAt: Date.now() }
    try {
      let nextEntry = localEntry
      if (user && backingPlanet?.dbId) {
        nextEntry = await saveChirpMomentEntry(backingPlanet, text, draftEntryId)
      }
      const restEntries = momentEntries.filter(entry => entry.id !== draftEntryId && entry.id !== nextEntry.id)
      const nextEntries = [nextEntry, ...restEntries]
      setMomentEntries(nextEntries)
      setDraftEntryId(nextEntry.id)
      saveLocalMomentEntries(activeMomentId, nextEntries)
      setSavedAt(Date.now())
      window.dispatchEvent(new CustomEvent('chirp:planet-activity'))
    } catch (error) {
      console.warn('Failed to save Moment entry:', error)
      const restEntries = momentEntries.filter(entry => entry.id !== draftEntryId && entry.id !== localEntry.id)
      const nextEntries = [localEntry, ...restEntries]
      setMomentEntries(nextEntries)
      setDraftEntryId(localEntry.id)
      saveLocalMomentEntries(activeMomentId, nextEntries)
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const text = draftText.trim()
    if (!text) return undefined
    const timer = window.setTimeout(() => saveMomentDraft(text), 900)
    return () => window.clearTimeout(timer)
  }, [draftText])

  useEffect(() => {
    if (activeMomentId !== 'inner-child' && aiMode) setAiMode(false)
  }, [activeMomentId, aiMode])

  const jumpToMomentDate = (month, day) => {
    const target = MOMENTS_DATE_TARGETS[month]?.[day] || 'today'
    setCalendarOpen(false)
    window.setTimeout(() => {
      document.getElementById(`moment-date-${target}`)?.scrollIntoView({ block: 'start' })
    }, 0)
  }

  const renderMonth = (month, label, todayDay) => {
    const days = MOMENTS_CAL_DATA[month]
    const count = days.filter(kind => kind !== 'none').length
    return (
      <section className="moments-cal-month">
        <div className="moments-cal-month-label">{label} <span className="moments-cal-month-count">· {count} days</span></div>
        <div className="moments-cal-days">
          {days.map((kind, index) => (
            <MomentsCalendarDay key={`${month}-${index}`} kind={kind} day={index + 1} today={todayDay === index + 1} onOpen={() => jumpToMomentDate(month, index + 1)} />
          ))}
        </div>
      </section>
    )
  }

  const sampleSections = useMemo(() => {
    const sections = []
    const entries = aiMode && activeMomentId === 'inner-child'
      ? [MOMENTS_BIRD_PROMPT, ...(MOMENT_SAMPLE_ENTRIES[activeMomentId] || [])]
      : (MOMENT_SAMPLE_ENTRIES[activeMomentId] || [])
    ;entries.forEach(entry => {
      let section = sections.find(item => item.key === entry.dateKey)
      if (!section) {
        section = { key: entry.dateKey, label: entry.dateLabel, entries: [] }
        sections.push(section)
      }
      section.entries.push(entry)
    })
    return sections
  }, [activeMomentId])

  return (
    <main className="chirp-moments-page">
      <section className="moments-topic-row">
        {MOMENT_SPACES.map(space => (
          <button className={`moments-topic ${space.className} ${activeMomentId === space.id ? 'active' : ''}`} type="button" key={space.id} onClick={() => setActiveMomentId(space.id)}>
            <span className="moments-topic-info">
              <span className="moments-topic-name">{space.title}</span>
              <span className="moments-topic-sub">{space.subtitle}</span>
            </span>
          </button>
        ))}
        <button className="moments-topic create" type="button">
          <span className="moments-topic-plus">+</span>
          <span className="moments-topic-info">
            <span className="moments-topic-name">Create a moment</span>
          </span>
        </button>
      </section>

      <section className="moments-memo-frame" style={{ backgroundColor: paperColor }}>
        <div className="moments-memo-toolbar">
          <div className="moments-m-left">
            <button className="moments-m-dots" type="button" title="Records panel" onClick={() => { setBgPickerOpen(false); setCalendarOpen(true) }}>
              <span className="moments-md both" />
              <span className="moments-md me" />
              <span className="moments-md fr" />
              <span className="moments-md both" />
              <span className="moments-m-dots-arrow">▾</span>
            </button>
          </div>

          <div className="moments-m-center">
            <button className="moments-m-tool" type="button" title="Attach"><MomentsPaperclipIcon /></button>
            <button className="moments-m-tool" type="button" title="Voice"><MomentsMicIcon /></button>
            {activeMomentId === 'inner-child' && (
              <button className={`moments-m-aimode ${aiMode ? 'on' : ''}`} type="button" onClick={() => setAiMode(prev => !prev)}>
                <span>AI Mode</span>
                <span className="moments-ai-switch" />
              </button>
            )}
          </div>

          <div className="moments-m-right">
            <button className={`moments-m-more ${bgPickerOpen ? 'on' : ''}`} type="button" title="More" onClick={() => setBgPickerOpen(prev => !prev)}>
              <span className="moments-m-more-dot" />
              <span className="moments-m-more-dot" />
              <span className="moments-m-more-dot" />
            </button>
          </div>
        </div>

        <div className={`moments-memo-scroll ${paperPattern}`} onClick={() => setComposerActive(true)}>
          <div className="moments-memo-doc">
            {sampleSections.map(section => (
              <section className="moments-date-group" id={`moment-date-${section.key}`} key={section.key}>
                <div className="moments-date-section">{section.label}</div>
                {section.key === 'today' && momentEntries.map(entry => (
                  <div className="moments-entry" key={entry.id}>
                    <div className="moments-entry-time">{formatActivityTime(entry.createdAt)} · S</div>
                    <div className="moments-entry-text me" lang={/[\u4e00-\u9fff]/.test(entry.text) ? 'zh' : 'en'}>{entry.text}</div>
                  </div>
                ))}
                {section.entries.map(entry => (
                  <div className="moments-entry" key={entry.id}>
                    <div className="moments-entry-time">{entry.time}</div>
                    <div className={`moments-entry-text ${entry.tone}`} lang="zh">{entry.text}</div>
                    {entry.image && (
                      <div className="moments-entry-img">
                        <div className={`moments-entry-img-inner ${entry.image}`}>{entry.imageText}</div>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            ))}

            {composerActive && (
              <div className="moments-composer">
                <textarea
                  value={draftText}
                  onChange={(event) => {
                    setDraftText(event.target.value)
                    setComposerActive(true)
                  }}
                  autoFocus
                  placeholder="Write a moment..."
                  rows="2"
                />
                <div className="moments-save-state">{saving ? 'Saving' : ''}</div>
              </div>
            )}
            {!composerActive && <div className="moments-paper-cursor"><div className="moments-paper-cursor-line" /></div>}
          </div>
        </div>

        <div className={`moments-overlay ${calendarOpen ? 'on' : ''}`} style={{ backgroundColor: paperColor }}>
          <div className="moments-overlay-inner">
            <div className="moments-overlay-head">
              <div className="moments-overlay-title">All Entries</div>
              <button className="moments-ov-close" type="button" onClick={() => setCalendarOpen(false)}>✕</button>
            </div>
            <div className="moments-cal-legend">
              <span><i className="gold" />S</span>
              <span><i className="blue" />X</span>
              <span><i className="both" />Both</span>
              <span><i className="empty" />Empty</span>
            </div>
            {renderMonth('may', 'May 2026', 14)}
            {renderMonth('apr', 'April 2026')}
            {renderMonth('mar', 'March 2026')}
          </div>
        </div>

        <div className={`moments-bg-picker ${bgPickerOpen ? 'on' : ''}`} style={{ backgroundColor: paperColor }}>
          <div className="moments-bg-picker-title">Paper</div>
          <div className="moments-bg-picker-section">
            <div className="moments-bg-picker-label">Color</div>
            <div className="moments-bg-colors">
              {MOMENTS_PAPER_COLORS.map(color => (
                <button className={`moments-bg-color ${paperColor === color ? 'on' : ''}`} type="button" key={color} style={{ backgroundColor: color }} onClick={() => setPaperColor(color)} aria-label={`Use paper color ${color}`} />
              ))}
            </div>
          </div>
          <div className="moments-bg-picker-section">
            <div className="moments-bg-picker-label">Pattern</div>
            <div className="moments-bg-patterns">
              {MOMENTS_PAPER_PATTERNS.map(pattern => (
                <button className={`moments-bg-pat ${paperPattern === pattern.id ? 'on' : ''}`} type="button" key={pattern.name} onClick={() => setPaperPattern(pattern.id)}>
                  <span className={`moments-bg-pat-preview ${pattern.preview}`} />
                  <span className="moments-bg-pat-name">{pattern.name}</span>
                </button>
              ))}
            </div>
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
            <button
              type="button"
              onClick={() => {
                onClose()
                navigateTo('chirp', 'moments')
              }}
            >
              <span>✎</span><strong>Moments</strong>
            </button>
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



