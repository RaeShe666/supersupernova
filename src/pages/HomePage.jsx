import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ProjectCard from '../components/ProjectCard'
import Loading from '../components/Loading'
import './HomePage.css'

const SCROLL_STORAGE_KEY = 'homepage_scroll_position'

function HomePage({ projects, onExtract, onEditProject, onDeleteProject, isExtracting }) {
    const [url, setUrl] = useState('')
    const { user, signOut } = useAuth()
    const [showUserMenu, setShowUserMenu] = useState(false)

    // Restore scroll position on mount
    useEffect(() => {
        const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY)
        if (savedScroll) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                window.scrollTo(0, parseInt(savedScroll, 10))
            })
        }
    }, [])

    // Save scroll position on scroll
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY.toString())
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleExtract = (e) => {
        e.preventDefault()
        if (url.trim()) {
            // If not logged in, redirect to login
            if (!user) {
                window.location.hash = '/login'
                return
            }
            // If logged in, proceed with extraction
            onExtract(url.trim())
        }
    }

    const handleSignOut = async () => {
        try {
            await signOut()
            setShowUserMenu(false)
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    return (
        <div className="home-page">
            {/* SVG Filter Definitions (Hidden) */}
            <svg className="svg-filters">
                <defs>
                    <filter id="squiggly-0">
                        <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="0" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                    </filter>
                    <filter id="squiggly-1">
                        <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="1" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
                    </filter>
                </defs>
            </svg>

            {/* Global Noise Texture */}
            <div className="global-noise"></div>

            {/* Header */}
            <header className="app-header">
                <div className="brand-logo">
                    <img src="/logo-home1.png" alt="Logo" className="header-logo-img" />
                    SYL.AILABS
                </div>

                <nav className="header-nav">
                    {user ? (
                        <div
                            className="user-account"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                        >
                            <div className="user-status-dot"></div>
                            <span>{user.displayName || user.email.split('@')[0] || 'ACCOUNT_01'}</span>

                            {showUserMenu && (
                                <div className="dropdown-menu">
                                    {user.displayName && (
                                        <div className="dropdown-user-info">
                                            <span className="dropdown-username">{user.displayName}</span>
                                        </div>
                                    )}
                                    <div className="dropdown-user-info">
                                        <span className="dropdown-email">{user.email}</span>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item" onClick={handleSignOut}>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <a href="#/login" className="auth-btn-text">[ Sign In ]</a>
                        </div>
                    )}
                </nav>
            </header>

            {/* Main Content */}
            <main className="main-content">

                {/* 1. Experiments Section */}
                <section className="experiments-section">
                    <div className="section-header-block">
                        <div className="section-header-text">
                            <span className="section-label">1. experiments</span>
                            <h2 className="section-title-large">Brand Kit Extractor</h2>
                            <p className="section-description">
                                Paste a URL below to decode its brand DNA.<br />
                                Get logo, color, typography, visual system, and brand context in seconds.
                            </p>
                        </div>
                    </div>

                    {/* Paper Doodle Dialog Box */}
                    <div className="doodle-dialog-wrapper">
                        <form onSubmit={handleExtract} className="doodle-dialog">
                            {/* Paper background with squiggly filter */}
                            <div className="doodle-paper-bg"></div>

                            {/* Content */}
                            <div className="doodle-content">
                                <div className="doodle-input-group">
                                    <label className="doodle-label">
                                        <span className="asterisk">*</span> Brand URL
                                    </label>
                                    <div className="doodle-input-wrapper">
                                        <div className="doodle-underline-base"></div>
                                        <div className="doodle-underline-active"></div>
                                        <input
                                            type="text"
                                            className="doodle-input"
                                            placeholder="www.example.com"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            disabled={isExtracting}
                                        />
                                        {url.trim() && (
                                            <span className="input-waiting">Waiting_</span>
                                        )}
                                    </div>
                                </div>

                                <div className="doodle-action-area">
                                    <button
                                        type="submit"
                                        className="doodle-button"
                                        disabled={isExtracting || !url.trim()}
                                    >
                                        <span className="doodle-button-bg"></span>
                                        <span className="doodle-button-text">
                                            {isExtracting ? 'Extracting...' : 'Extract Brand Kit'}
                                            {!isExtracting && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    <polyline points="12 5 19 12 12 19"></polyline>
                                                </svg>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Corner decorations */}
                            <div className="corner-deco corner-top-left"></div>
                            <div className="corner-deco corner-bottom-right"></div>
                        </form>
                    </div>
                </section>

                {/* 2. My Projects Section */}
                <section className="projects-section">
                    <div className="projects-header-block">
                        <div className="projects-header-left">
                            <span className="section-label">2. my projects</span>
                            <h2 className="section-title">My Projects</h2>
                        </div>
                        <span className="projects-counter">
                            {String(projects.length).padStart(2, '0')} / PROJECTS
                        </span>
                    </div>

                    <div className="projects-grid">
                        {/* New Project Card - Only when no projects */}
                        {projects.length === 0 && (
                            <div className="new-project-card">
                                <div className="new-project-card-inner">
                                    <div className="new-project-noise"></div>
                                    <div className="new-project-content">
                                        <div className="new-project-icon">
                                            <span className="plus-sign">+</span>
                                        </div>
                                        <span className="new-project-text">New Project</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Existing Project Cards - Keep original logic */}
                        {projects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onClick={() => onEditProject(project)}
                                onDelete={() => onDeleteProject(project.id)}
                            />
                        ))}
                    </div>
                </section>
            </main>

            {/* Loading Overlay */}
            {isExtracting && (
                <div className="loading-overlay">
                    <Loading />
                </div>
            )}
        </div>
    )
}

export default HomePage
