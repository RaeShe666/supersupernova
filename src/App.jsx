import { useState, useEffect, useRef, useCallback } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { supabase } from './supabaseClient'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import LoginPage from './pages/LoginPage'
import { extractBrandKit } from './services/aiService'
import './App.css'

// Parse hash route
const getRouteFromHash = () => {
  const hash = window.location.hash.slice(1) || '/home'
  const parts = hash.split('/').filter(Boolean)
  return {
    page: parts[0] || 'home',
    projectId: parts[1] || null
  }
}

// Navigate to a route
const navigateTo = (page, projectId = null) => {
  if (projectId) {
    window.location.hash = `/${page}/${projectId}`
  } else {
    window.location.hash = `/${page}`
  }
}

function AppContent() {
  const { user, loading, getAccessToken, signOut } = useAuth()
  const initialRoute = getRouteFromHash()
  const [currentPage, setCurrentPage] = useState(initialRoute.page)
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const projectsLoadedRef = useRef(false)
  const pendingRouteRef = useRef(null)
  // Track if we're waiting for editor project to load
  const initialEditorProjectId = useRef(
    initialRoute.page === 'editor' ? initialRoute.projectId : null
  )

  // Load projects from Supabase when user logged in
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

        // Transform Supabase data to app format
        const transformed = data.map(p => ({
          id: p.id,
          url: p.url,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          ...p.data
        }))
        setProjects(transformed)
        projectsLoadedRef.current = true

        // After loading projects, restore editor state from URL
        const route = getRouteFromHash()
        if (route.page === 'editor' && route.projectId) {
          const project = transformed.find(p => p.id === route.projectId)
          if (project) {
            setCurrentProject(project)
            setCurrentPage('editor')
          } else {
            // Project not found, go home
            initialEditorProjectId.current = null
            navigateTo('home')
          }
        } else {
          setCurrentPage(route.page)
        }
        // Clear the initial editor flag after loading
        initialEditorProjectId.current = null
      } catch (err) {
        console.error('Failed to load projects:', err)
      } finally {
        setDataLoading(false)
      }
    }

    loadProjects()
  }, [user])

  // Sync projects state to Ref for event handlers
  const projectsStateRef = useRef(projects)
  useEffect(() => {
    projectsStateRef.current = projects
  }, [projects])

  // Handle hash change (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const route = getRouteFromHash()

      // If projects not loaded yet (initial load), save pending route
      if (!projectsLoadedRef.current && route.page === 'editor' && route.projectId) {
        pendingRouteRef.current = route
        return
      }

      setCurrentPage(route.page)

      if (route.page === 'editor' && route.projectId) {
        // Use Ref to get latest state during event callback
        const project = projectsStateRef.current.find(p => p.id === route.projectId)
        setCurrentProject(project || null)
        if (!project) {
          // Project not found, go home
          navigateTo('home')
        }
      } else {
        setCurrentProject(null)
      }
    }

    // Set initial hash if empty
    if (!window.location.hash) {
      window.location.hash = '/home'
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, []) // Empty dependency array, relies on Ref for state access

  // Handle URL extraction
  const handleExtract = async (url) => {
    setIsExtracting(true)

    try {
      // Get access token for backend authentication
      const token = await getAccessToken()

      // Call AI service to extract brand kit
      const extractedData = await extractBrandKit(url, token)

      // Create a new project with extracted data
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

      // Save to Supabase
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
      // Update ref immediately so hash change handler can find the project
      projectsStateRef.current = updatedProjects
      setCurrentProject(newProject)
      // Navigate using hash
      navigateTo('editor', newProject.id)
    } catch (error) {
      console.error('Extraction failed:', error)
      // Still create a blank project on error
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
          // Update ref immediately so hash change handler can find the project
          projectsStateRef.current = updatedProjects
          setCurrentProject(newProject)
          navigateTo('editor', newProject.id)
        }
      } catch (e) {
        console.error('Failed to create blank project:', e)
      }
    } finally {
      setIsExtracting(false)
    }
  }

  // Handle save project to Supabase
  const handleSaveProject = async (projectData) => {
    // Update local state immediately
    const existingIndex = projects.findIndex(p => p.id === projectData.id)
    if (existingIndex >= 0) {
      const updated = [...projects]
      updated[existingIndex] = projectData
      setProjects(updated)
    }
    setCurrentProject(projectData)
  }

  // Handle edit project
  const handleEditProject = (project) => {
    setCurrentProject(project)
    navigateTo('editor', project.id)
  }

  // Handle delete project
  const handleDeleteProject = async (projectId, isRetry = false) => {
    console.log('Deleting project:', projectId, isRetry ? '(retry)' : '')
    const originalProjects = [...projects]

    // Check and refresh session if needed
    let { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('No session, attempting refresh...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !refreshData.session) {
        console.error('Session refresh failed:', refreshError)
        alert('登录已过期，请重新登录')
        navigateTo('login')
        return
      }
      session = refreshData.session
      console.log('Session refreshed successfully')
    }
    console.log('Session valid, expires at:', new Date(session.expires_at * 1000).toLocaleString())

    // Optimistic update
    setProjects(projects.filter(p => p.id !== projectId))

    try {
      const { data, error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .select()

      console.log('Delete result:', { data, error, rowsAffected: data?.length || 0 })

      if (error) {
        console.error('Failed to delete from Supabase:', error)
        setProjects(originalProjects)
        alert('Delete failed: ' + error.message)
      } else if (!data || data.length === 0) {
        // No rows deleted - try refreshing token and retry once
        if (!isRetry) {
          console.log('No rows affected, refreshing token and retrying...')
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (!refreshError && refreshData.session) {
            setProjects(originalProjects) // Restore before retry
            return handleDeleteProject(projectId, true)
          }
        }
        console.error('Delete failed: No rows affected after retry')
        setProjects(originalProjects)
        alert('删除失败，请重新登录后重试')
      } else {
        console.log('Project deleted successfully:', data[0]?.id)
      }
    } catch (err) {
      console.error('Delete error:', err)
      setProjects(originalProjects)
      alert('Delete error: ' + err.message)
    }
  }

  // Handle back to home
  const handleBack = () => {
    setCurrentProject(null)
    navigateTo('home')
  }

  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
    navigateTo('home')
  }

  // Show loading while checking auth or waiting for editor project
  const isWaitingForEditorProject = currentPage === 'editor' && !currentProject && initialEditorProjectId.current
  if (loading || dataLoading || isWaitingForEditorProject) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="btn-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ marginTop: 16, color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page only when explicitly navigating to it
  if (currentPage === 'login' && !user) {
    return <LoginPage />
  }

  // Redirect to home if trying to access login while already logged in
  if (currentPage === 'login' && user) {
    navigateTo('home')
  }

  return (
    <div className="app">
      {currentPage === 'editor' && currentProject ? (
        <EditorPage
          project={currentProject}
          onSave={handleSaveProject}
          onBack={handleBack}
        />
      ) : (
        <HomePage
          projects={projects}
          onExtract={handleExtract}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          isExtracting={isExtracting}
          user={user}
          onSignOut={handleSignOut}
        />
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
