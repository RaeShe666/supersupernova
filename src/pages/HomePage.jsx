import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ProjectCard from '../components/ProjectCard'
import Loading from '../components/Loading'
import './HomePage.css'

const SCROLL_STORAGE_KEY = 'homepage_scroll_position'

function HomePage({ page, projects, onExtract, onEditProject, onDeleteProject, isExtracting }) {
    const [url, setUrl] = useState('')
    const { user } = useAuth()
    const activePage = page || 'home'

    useEffect(() => {
        const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY)
        if (savedScroll) {
            requestAnimationFrame(() => {
                window.scrollTo(0, parseInt(savedScroll, 10))
            })
        }
    }, [])

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
            if (!user) {
                window.location.hash = '/login'
                return
            }
            onExtract(url.trim())
        }
    }

    const goToBrandKitArea = (area) => {
        window.location.hash = `/brandkit/${area}`
    }

    const renderLanding = () => (
        <main className="main-content">
            <section className="brandkit-entry-section">
                <div className="section-header-block">
                    <div className="section-header-text">
                        <span className="section-label">1. experiments</span>
                        <h2 className="section-title-large">Brand Kit Extractor</h2>
                        <p className="section-description">
                            Choose the workspace you need. Capture polished demos, or extract and manage brand DNA.
                        </p>
                    </div>
                </div>

                <div className="brandkit-entry-grid">
                    <button className="brandkit-entry-card demo-entry" type="button" onClick={() => goToBrandKitArea('demo-studio')}>
                        <span className="entry-kicker">record / edit</span>
                        <strong>Demo Studio</strong>
                        <span>Desktop recording with cursor follow, smart zoom, custom background, and an editor.</span>
                        <i>Open studio</i>
                    </button>

                    <button className="brandkit-entry-card asset-entry" type="button" onClick={() => goToBrandKitArea('assets')}>
                        <span className="entry-kicker">extract / manage</span>
                        <strong>My Asset</strong>
                        <span>Extract brand DNA from a URL and keep your saved brand kit projects in one place.</span>
                        <i>Open assets</i>
                    </button>
                </div>
            </section>
        </main>
    )

    const renderDemoStudio = () => (
        <main className="main-content">
            <section className="demo-studio-section">
                <div className="section-header-block">
                    <div className="section-header-text">
                        <span className="section-label">1. demo studio</span>
                        <h2 className="section-title-large">Demo Studio</h2>
                        <p className="section-description">
                            Record your desktop, keep the cursor editable, add smart zooms, and finish videos with custom backgrounds.
                        </p>
                    </div>
                </div>

                <div className="demo-studio-panel">
                    <div className="demo-studio-list">
                        <span>Cursor follow</span>
                        <span>Smart zoom editor</span>
                        <span>Custom recording background</span>
                        <span>Timeline editing</span>
                    </div>
                    <div className="demo-studio-note">
                        Demo Studio is a desktop tool in this repo. For now, run it locally from <code>desktop/demo-studio</code>.
                    </div>
                </div>
            </section>
        </main>
    )

    const renderAssets = () => (
        <main className="main-content">

            {/* 1. Experiments Section */}
            <section className="experiments-section">
                <div className="section-header-block">
                    <div className="section-header-text">
                        <span className="section-label">1. my asset</span>
                        <h2 className="section-title-large">Brand DNA</h2>
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
                        <span className="section-label">2. saved assets</span>
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
    )

    return (
        <div className="home-page">
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

            <div className="global-noise"></div>

            {activePage === 'demo-studio' ? renderDemoStudio() : activePage === 'assets' ? renderAssets() : renderLanding()}

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
