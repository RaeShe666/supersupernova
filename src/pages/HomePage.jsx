import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ProjectCard from '../components/ProjectCard'
import Loading from '../components/Loading'
import './HomePage.css'

const SCROLL_STORAGE_KEY = 'homepage_scroll_position'

function HomePage({ page, projects, onExtract, onEditProject, onDeleteProject, isExtracting }) {
    const [url, setUrl] = useState('')
    const [demoStatus, setDemoStatus] = useState('idle')
    const [demoError, setDemoError] = useState('')
    const [demoRecordingUrl, setDemoRecordingUrl] = useState('')
    const [demoBackground, setDemoBackground] = useState('sage')
    const demoPreviewRef = useRef(null)
    const demoRecorderRef = useRef(null)
    const demoStreamRef = useRef(null)
    const demoChunksRef = useRef([])
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

    const stopDemoStream = () => {
        if (demoStreamRef.current) {
            demoStreamRef.current.getTracks().forEach(track => track.stop())
            demoStreamRef.current = null
        }
    }

    useEffect(() => {
        return () => {
            stopDemoStream()
            if (demoRecordingUrl) {
                URL.revokeObjectURL(demoRecordingUrl)
            }
        }
    }, [demoRecordingUrl])

    const startDemoRecording = async () => {
        setDemoError('')

        if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === 'undefined') {
            setDemoError('Screen recording is not available in this browser.')
            return
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 30 },
                audio: true
            })
            demoChunksRef.current = []
            stopDemoStream()
            demoStreamRef.current = stream

            if (demoPreviewRef.current) {
                demoPreviewRef.current.srcObject = stream
                demoPreviewRef.current.muted = true
                await demoPreviewRef.current.play()
            }

            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? 'video/webm;codecs=vp9'
                : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
                    ? 'video/webm;codecs=vp8'
                    : 'video/webm'
            const recorder = new MediaRecorder(stream, { mimeType })
            demoRecorderRef.current = recorder

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    demoChunksRef.current.push(event.data)
                }
            }

            recorder.onstop = () => {
                const blob = new Blob(demoChunksRef.current, { type: 'video/webm' })
                const nextUrl = URL.createObjectURL(blob)
                setDemoRecordingUrl(previousUrl => {
                    if (previousUrl) URL.revokeObjectURL(previousUrl)
                    return nextUrl
                })
                setDemoStatus('ready')
                stopDemoStream()
                if (demoPreviewRef.current) {
                    demoPreviewRef.current.srcObject = null
                    demoPreviewRef.current.src = nextUrl
                    demoPreviewRef.current.muted = false
                    demoPreviewRef.current.controls = true
                }
            }

            stream.getVideoTracks()[0]?.addEventListener('ended', () => {
                if (demoRecorderRef.current?.state === 'recording') {
                    demoRecorderRef.current.stop()
                }
            })

            recorder.start()
            setDemoStatus('recording')
        } catch (error) {
            if (error?.name !== 'NotAllowedError') {
                setDemoError('Could not start recording. Check screen recording permission and try again.')
            }
            setDemoStatus('idle')
            stopDemoStream()
        }
    }

    const stopDemoRecording = () => {
        if (demoRecorderRef.current?.state === 'recording') {
            demoRecorderRef.current.stop()
        } else {
            stopDemoStream()
            setDemoStatus(demoRecordingUrl ? 'ready' : 'idle')
        }
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
                            Start a desktop recording, preview the result, and shape it with the editing controls.
                        </p>
                    </div>
                </div>

                <div className="demo-editor-shell">
                    <div className={`demo-preview-stage bg-${demoBackground}`}>
                        <div className="demo-screen-frame">
                            <video
                                ref={demoPreviewRef}
                                className="demo-preview-video"
                                autoPlay
                                playsInline
                                controls={demoStatus === 'ready'}
                            />
                            {demoStatus === 'idle' && !demoRecordingUrl && (
                                <div className="demo-empty-state">
                                    <span>Ready to record</span>
                                    <strong>Choose Start Recording to capture your screen.</strong>
                                </div>
                            )}
                            {demoStatus === 'recording' && (
                                <div className="demo-recording-badge">Recording</div>
                            )}
                        </div>
                    </div>

                    <aside className="demo-control-panel">
                        <div className="demo-control-head">
                            <span className="section-label">studio controls</span>
                            <h3>Recorder</h3>
                        </div>

                        <div className="demo-control-group">
                            <label>Recording background</label>
                            <div className="demo-background-options">
                                {['sage', 'paper', 'ink'].map(option => (
                                    <button
                                        key={option}
                                        type="button"
                                        className={`demo-bg-swatch ${option} ${demoBackground === option ? 'active' : ''}`}
                                        onClick={() => setDemoBackground(option)}
                                        aria-label={`Use ${option} background`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="demo-control-group">
                            <label>Editing defaults</label>
                            <div className="demo-feature-list">
                                <span>Cursor follow</span>
                                <span>Smart zoom</span>
                                <span>Timeline edit</span>
                                <span>Background</span>
                            </div>
                        </div>

                        {demoError && <div className="demo-error">{demoError}</div>}

                        <div className="demo-action-row">
                            {demoStatus === 'recording' ? (
                                <button className="demo-primary-action stop" type="button" onClick={stopDemoRecording}>
                                    Stop Recording
                                </button>
                            ) : (
                                <button className="demo-primary-action" type="button" onClick={startDemoRecording}>
                                    Start Recording
                                </button>
                            )}
                            {demoRecordingUrl && demoStatus !== 'recording' && (
                                <a className="demo-secondary-action" href={demoRecordingUrl} download="demo-studio-recording.webm">
                                    Download
                                </a>
                            )}
                        </div>
                    </aside>
                </div>

                <div className="demo-timeline-panel">
                    <div className="demo-timeline-head">
                        <span>Timeline</span>
                        <small>{demoStatus === 'recording' ? 'capturing screen' : demoRecordingUrl ? 'recording ready' : 'no clip yet'}</small>
                    </div>
                    <div className={`demo-timeline-track ${demoRecordingUrl || demoStatus === 'recording' ? 'active' : ''}`}>
                        <span></span>
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
