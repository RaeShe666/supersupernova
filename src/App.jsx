import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { supabase } from './supabaseClient'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import LoginPage from './pages/LoginPage'
import ChirpHomePage, { OnboardingAnimalAvatar, readOnboardingProfile } from './pages/ChirpHomePage'
import { extractBrandKit } from './services/aiService'
import './App.css'

const parseRoute = () => {
  const hash = window.location.hash.slice(1) || '/'
  const parts = hash.split('/').filter(Boolean)
  // Routes: / (landing), brandkit (brand kit home), brandkit/editor/:id, chirp, chirp/planet/:id, login
  return {
    section: parts[0] || 'landing',
    page: parts[1] || null,
    id: parts[2] || null
  }
}

const navigateTo = (...segments) => {
  window.location.hash = '/' + segments.filter(Boolean).join('/')
}

function AppContent() {
  const { user, loading, getAccessToken, signOut } = useAuth()
  const route = parseRoute()
  const [currentSection, setCurrentSection] = useState(route.section)
  const [currentPage, setCurrentPage] = useState(route.page)
  const [currentId, setCurrentId] = useState(route.id)
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [chirpProfile, setChirpProfile] = useState(() => readOnboardingProfile())
  const projectsLoadedRef = useRef(false)
  const initialEditorProjectId = useRef(
    route.section === 'brandkit' && route.page === 'editor' ? route.id : null
  )

  useEffect(() => {
    if (!user) {
      setProjects([])
      setDataLoading(false)
      projectsLoadedRef.current = false
      return
    }

    async function loadProjects() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('updated_at', { ascending: false })

        if (error) throw error

        const transformed = data.map(p => ({
          id: p.id,
          url: p.url,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          ...p.data
        }))
        setProjects(transformed)
        projectsLoadedRef.current = true

        const r = parseRoute()
        if (r.section === 'brandkit' && r.page === 'editor' && r.id) {
          const project = transformed.find(p => p.id === r.id)
          if (project) {
            setCurrentProject(project)
            setCurrentSection('brandkit')
            setCurrentPage('editor')
            setCurrentId(r.id)
          } else {
            initialEditorProjectId.current = null
            navigateTo('brandkit')
          }
        } else {
          setCurrentSection(r.section)
          setCurrentPage(r.page)
          setCurrentId(r.id)
        }
        initialEditorProjectId.current = null
      } catch (err) {
        console.error('Failed to load projects:', err)
      } finally {
        setDataLoading(false)
      }
    }

    loadProjects()
  }, [user])

  const projectsStateRef = useRef(projects)
  useEffect(() => {
    projectsStateRef.current = projects
  }, [projects])

  useEffect(() => {
    const handleHashChange = () => {
      const r = parseRoute()

      if (!projectsLoadedRef.current && r.section === 'brandkit' && r.page === 'editor' && r.id) {
        return
      }

      setCurrentSection(r.section)
      setCurrentPage(r.page)
      setCurrentId(r.id)

      if (r.section === 'brandkit' && r.page === 'editor' && r.id) {
        const project = projectsStateRef.current.find(p => p.id === r.id)
        setCurrentProject(project || null)
        if (!project) {
          navigateTo('brandkit')
        }
      } else {
        setCurrentProject(null)
      }
    }

    if (!window.location.hash) {
      window.location.hash = '/'
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    const refreshChirpProfile = () => {
      setChirpProfile(readOnboardingProfile())
    }
    window.addEventListener('chirp:onboarding-updated', refreshChirpProfile)
    window.addEventListener('storage', refreshChirpProfile)
    return () => {
      window.removeEventListener('chirp:onboarding-updated', refreshChirpProfile)
      window.removeEventListener('storage', refreshChirpProfile)
    }
  }, [])

  const handleExtract = async (url) => {
    setIsExtracting(true)

    try {
      const token = await getAccessToken()
      const extractedData = await extractBrandKit(url, token)

      const projectData = {
        brandIdentity: {
          name: extractedData.brandIdentity?.name || '',
          logo: extractedData.brandIdentity?.logo || null,
          tagline: extractedData.brandIdentity?.tagline || '',
          colors: extractedData.visualSystem?.colors || ['#FF6B4A', '#4A7BF7', '#22C55E', '#9333EA'],
          typography: extractedData.visualSystem?.typography || 'Inter'
        },
        visualSystem: {
          baseAppearance: extractedData.visualSystem?.baseAppearance || 'clean-minimal'
        },
        brandContext: {
          overview: extractedData.brandContext?.overview || '',
          keywords: extractedData.brandContext?.keywords || [],
          tones: extractedData.brandContext?.tones || [],
          images: extractedData.brandContext?.images || []
        }
      }

      const { data: inserted, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          url: url,
          name: projectData.brandIdentity.name,
          data: projectData
        })
        .select()
        .single()

      if (error) throw error

      const newProject = {
        id: inserted.id,
        url: inserted.url,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
        ...projectData
      }

      const updatedProjects = [newProject, ...projects]
      setProjects(updatedProjects)
      projectsStateRef.current = updatedProjects
      setCurrentProject(newProject)
      navigateTo('brandkit', 'editor', newProject.id)
    } catch (error) {
      console.error('Extraction failed:', error)
      const blankProjectData = {
        brandIdentity: { name: '', logo: null, tagline: '', colors: ['#FF6B4A', '#4A7BF7', '#22C55E', '#9333EA'], typography: 'Inter' },
        visualSystem: { baseAppearance: 'clean-minimal' },
        brandContext: { overview: '', keywords: [], tones: [], images: [] }
      }

      try {
        const { data: inserted, error: insertError } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            url: url,
            name: '',
            data: blankProjectData
          })
          .select()
          .single()

        if (!insertError) {
          const newProject = {
            id: inserted.id,
            url: inserted.url,
            createdAt: inserted.created_at,
            updatedAt: inserted.updated_at,
            ...blankProjectData
          }
          const updatedProjects = [newProject, ...projects]
          setProjects(updatedProjects)
          projectsStateRef.current = updatedProjects
          setCurrentProject(newProject)
          navigateTo('brandkit', 'editor', newProject.id)
        }
      } catch (e) {
        console.error('Failed to create blank project:', e)
      }
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSaveProject = async (projectData) => {
    const existingIndex = projects.findIndex(p => p.id === projectData.id)
    if (existingIndex >= 0) {
      const updated = [...projects]
      updated[existingIndex] = projectData
      setProjects(updated)
    }
    setCurrentProject(projectData)
  }

  const handleEditProject = (project) => {
    setCurrentProject(project)
    navigateTo('brandkit', 'editor', project.id)
  }

  const handleDeleteProject = async (projectId, isRetry = false) => {
    const originalProjects = [...projects]

    let { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !refreshData.session) {
        alert('登录已过期，请重新登录')
        navigateTo('login')
        return
      }
      session = refreshData.session
    }

    setProjects(projects.filter(p => p.id !== projectId))

    try {
      const { data, error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .select()

      if (error) {
        setProjects(originalProjects)
        alert('Delete failed: ' + error.message)
      } else if (!data || data.length === 0) {
        if (!isRetry) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (!refreshError && refreshData.session) {
            setProjects(originalProjects)
            return handleDeleteProject(projectId, true)
          }
        }
        setProjects(originalProjects)
        alert('删除失败，请重新登录后重试')
      }
    } catch (err) {
      setProjects(originalProjects)
      alert('Delete error: ' + err.message)
    }
  }

  const handleBack = () => {
    setCurrentProject(null)
    navigateTo('brandkit')
  }

  const handleSignOut = async () => {
    await signOut()
    navigateTo()
  }

  const handleGlobalLogoClick = () => {
    navigateTo()
  }

  const handleGlobalBrandTextClick = () => {
    if (currentSection === 'chirp') {
      if (!window.localStorage.getItem('chirpOnboardingProfile')) {
        window.dispatchEvent(new CustomEvent('chirp:open-onboarding'))
        return
      }
      navigateTo(currentSection)
      return
    }

    navigateTo()
  }

  const chirpNavItems = [
    { label: 'home', page: null, action: () => navigateTo('chirp') },
    { label: 'planet', page: 'planet', action: () => navigateTo('chirp', 'planet', 'love') },
    { label: 'persona', page: 'persona', action: () => navigateTo('chirp', 'persona') },
    { label: 'moments', page: 'moments', action: () => navigateTo('chirp', 'moments') }
  ]

  const isWaitingForEditorProject = currentSection === 'brandkit' && currentPage === 'editor' && !currentProject && initialEditorProjectId.current
  const isChirpSection = currentSection === 'chirp'
  const isPublicSection = currentSection === 'landing' || isChirpSection
  if (!isPublicSection && (loading || dataLoading || isWaitingForEditorProject)) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="btn-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ marginTop: 16, color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (currentSection === 'login' && !user) {
    return <LoginPage />
  }

  if (currentSection === 'login' && user) {
    navigateTo()
  }

  const renderContent = () => {
    if (currentSection === 'brandkit') {
      if (currentPage === 'editor' && currentProject) {
        return (
          <EditorPage
            project={currentProject}
            onSave={handleSaveProject}
            onBack={handleBack}
          />
        )
      }
      return (
        <HomePage
          projects={projects}
          onExtract={handleExtract}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          isExtracting={isExtracting}
          user={user}
          onSignOut={handleSignOut}
        />
      )
    }

    if (currentSection === 'chirp') {
      return <ChirpHomePage page={currentPage} id={currentId} />
    }

    // Landing page
    return (
      <div className="landing-page">
        <div className="landing-text">
          <Typewriter lines={[
            'Something is changing here.',
            'The builder is lazy, leaving nothing here.'
          ]} />
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Global Top Nav */}
      <nav className={`global-nav ${isChirpSection ? 'chirp-nav' : ''}`}>
        <div className="global-nav-brand">
          <img
            src="/logo-home-transparent.png"
            alt="Logo"
            className="global-nav-logo"
            onClick={handleGlobalLogoClick}
          />
          <button className="global-nav-brand-text" type="button" onClick={handleGlobalBrandTextClick}>
            {isChirpSection ? currentSection : 'SYL.AILABS'}
          </button>
        </div>

        {isChirpSection ? (
          <div className="global-nav-center">
            {chirpNavItems.map(item => (
              <button
                className={`global-nav-home-link ${currentPage === item.page ? 'active' : ''}`}
                type="button"
                key={item.label}
                onClick={item.action}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="global-nav-links">
            <a
              className={`global-nav-link ${currentSection === 'brandkit' ? 'active' : ''}`}
              onClick={() => navigateTo('brandkit')}
            >
              Brand Kit Extractor
            </a>
            <a
              className={`global-nav-link ${currentSection === 'chirp' ? 'active' : ''}`}
              onClick={() => navigateTo('chirp')}
            >
              Chirp
            </a>
          </div>
        )}

        <div className="global-nav-right">
          {isChirpSection && user && chirpProfile ? (
            <button className="global-nav-animal-button" type="button" onClick={() => navigateTo('chirp', 'about-me')} aria-label="About Me">
              <OnboardingAnimalAvatar animal={chirpProfile.animal} />
            </button>
          ) : user ? (
            <UserMenu user={user} onSignOut={handleSignOut} />
          ) : (
            <a className="global-nav-auth" onClick={() => navigateTo('login')}>
              [ Sign In ]
            </a>
          )}
        </div>
      </nav>

      <div className="app-body">
        {renderContent()}
      </div>
    </div>
  )
}

function Typewriter({ lines }) {
  const fullText = useMemo(() => lines.join('\n'), [lines])
  const [charIndex, setCharIndex] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (charIndex < fullText.length) {
      const char = fullText[charIndex]
      const delay = char === '\n' ? 400 : char === '.' ? 200 : 50 + Math.random() * 40
      const timer = setTimeout(() => setCharIndex(i => i + 1), delay)
      return () => clearTimeout(timer)
    } else {
      setDone(true)
    }
  }, [charIndex, fullText])

  const displayed = fullText.slice(0, charIndex)
  const displayedLines = displayed.split('\n')

  return (
    <div className="typewriter-container">
      {lines.map((line, i) => (
        <p key={i} className="landing-line">
          {displayedLines[i] || ''}
          {i === displayedLines.length - 1 && !done && (
            <span className="typewriter-cursor">|</span>
          )}
        </p>
      ))}
    </div>
  )
}

function UserMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="global-user-menu" onClick={() => setOpen(!open)}>
      <div className="global-user-dot"></div>
      <span>{user.displayName || user.email.split('@')[0]}</span>
      {open && (
        <div className="global-dropdown">
          {user.displayName && (
            <div className="global-dropdown-info">
              <span className="global-dropdown-name">{user.displayName}</span>
            </div>
          )}
          <div className="global-dropdown-info">
            <span className="global-dropdown-email">{user.email}</span>
          </div>
          <div className="global-dropdown-divider"></div>
          <button className="global-dropdown-item" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
