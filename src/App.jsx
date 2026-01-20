import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import { extractBrandKit } from './services/aiService'
import './App.css'

function App() {
  // 从 localStorage 恢复当前页面状态
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('brandkit-currentPage') || 'home'
  })
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(() => {
    const saved = localStorage.getItem('brandkit-currentProject')
    return saved ? JSON.parse(saved) : null
  })
  const [isExtracting, setIsExtracting] = useState(false)

  // Load projects from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('brandkit-projects')
    if (saved) {
      setProjects(JSON.parse(saved))
    }
  }, [])

  // Save projects to localStorage
  useEffect(() => {
    localStorage.setItem('brandkit-projects', JSON.stringify(projects))
  }, [projects])

  // 保存当前页面状态到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('brandkit-currentPage', currentPage)
    } catch (e) {
      console.warn('Failed to save currentPage:', e)
    }
  }, [currentPage])

  // 保存当前项目到 localStorage
  useEffect(() => {
    try {
      if (currentProject) {
        localStorage.setItem('brandkit-currentProject', JSON.stringify(currentProject))
      } else {
        localStorage.removeItem('brandkit-currentProject')
      }
    } catch (e) {
      console.warn('Failed to save currentProject (data may be too large):', e)
    }
  }, [currentProject])

  // Handle URL extraction
  const handleExtract = async (url) => {
    setIsExtracting(true)

    try {
      // Call AI service to extract brand kit
      const extractedData = await extractBrandKit(url)

      // Create a new project with extracted data
      const newProject = {
        id: Date.now().toString(),
        url: url,
        createdAt: new Date().toISOString(),
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

      setCurrentProject(newProject)
      setCurrentPage('editor')
    } catch (error) {
      console.error('Extraction failed:', error)
      // Still create a blank project on error
      const blankProject = {
        id: Date.now().toString(),
        url: url,
        createdAt: new Date().toISOString(),
        brandIdentity: { name: '', logo: null, tagline: '', colors: ['#FF6B4A', '#4A7BF7', '#22C55E', '#9333EA'], typography: 'Inter' },
        visualSystem: {
          baseAppearance: 'clean-minimal'
        },
        brandContext: { overview: '', keywords: [], tones: [], images: [] }
      }
      setCurrentProject(blankProject)
      setCurrentPage('editor')
    } finally {
      setIsExtracting(false)
    }
  }

  // Handle save project
  const handleSaveProject = (projectData) => {
    const existingIndex = projects.findIndex(p => p.id === projectData.id)

    if (existingIndex >= 0) {
      const updated = [...projects]
      updated[existingIndex] = projectData
      setProjects(updated)
    } else {
      setProjects([projectData, ...projects])
    }

    setCurrentProject(projectData)
  }

  // Handle edit project
  const handleEditProject = (project) => {
    setCurrentProject(project)
    setCurrentPage('editor')
  }

  // Handle delete project
  const handleDeleteProject = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId))
  }

  // Handle back to home
  const handleBack = () => {
    setCurrentProject(null)
    setCurrentPage('home')
  }

  return (
    <div className="app">
      {currentPage === 'home' ? (
        <HomePage
          projects={projects}
          onExtract={handleExtract}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          isExtracting={isExtracting}
        />
      ) : (
        <EditorPage
          project={currentProject}
          onSave={handleSaveProject}
          onBack={handleBack}
        />
      )}
    </div>
  )
}

export default App
