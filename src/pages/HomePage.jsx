import { useState } from 'react'
import UrlInput from '../components/UrlInput'
import ProjectCard from '../components/ProjectCard'
import Loading from '../components/Loading'
import './HomePage.css'

function HomePage({ projects, onExtract, onEditProject, onDeleteProject, isExtracting }) {
    const [url, setUrl] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (url.trim()) {
            onExtract(url.trim())
        }
    }

    return (
        <div className="home-page">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">AI-Powered</div>
                    <h1 className="hero-title">Brand Kit Extractor</h1>
                    <p className="hero-subtitle">
                        Extract complete brand assets from any website with AI.
                        Get logos, colors, typography, and brand context in seconds.
                    </p>

                    <form className="url-form" onSubmit={handleSubmit}>
                        <UrlInput
                            value={url}
                            onChange={setUrl}
                            disabled={isExtracting}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary extract-btn"
                            disabled={isExtracting || !url.trim()}
                        >
                            {isExtracting ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    Extracting...
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7,10 12,15 17,10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Extract Brand Kit
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Background decoration */}
                <div className="hero-bg-decoration">
                    <div className="blob blob-1"></div>
                    <div className="blob blob-2"></div>
                    <div className="blob blob-3"></div>
                </div>
            </div>

            {/* Loading Overlay */}
            {isExtracting && (
                <div className="loading-overlay">
                    <Loading />
                </div>
            )}

            {/* Projects Section */}
            {projects.length > 0 && (
                <div className="projects-section">
                    <div className="section-header">
                        <h2 className="section-title">My Projects</h2>
                        <span className="project-count">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="projects-grid">
                        {projects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onClick={() => onEditProject(project)}
                                onDelete={() => onDeleteProject(project.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default HomePage
