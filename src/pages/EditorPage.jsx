import { useState, useEffect, useRef } from 'react'
import BrandIdentity from '../components/BrandIdentity'
import VisualSystem from '../components/VisualSystem'
import BrandContext from '../components/BrandContext'
import './EditorPage.css'

function EditorPage({ project, onSave, onBack }) {
    const [formData, setFormData] = useState(project)
    const isInitialMount = useRef(true)

    // 仅在 project 变化时同步（不是每次父组件更新都同步）
    useEffect(() => {
        if (project?.id !== formData?.id) {
            setFormData(project)
        }
    }, [project?.id])

    // 自动保存：formData 变化时同步到父组件（跳过首次挂载）
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }
        if (formData) {
            onSave(formData)
        }
    }, [formData])

    const updateBrandIdentity = (updates) => {
        setFormData(prev => {
            if (!prev) return prev
            return {
                ...prev,
                brandIdentity: { ...prev.brandIdentity, ...updates }
            }
        })
    }

    const updateVisualSystem = (updates) => {
        setFormData(prev => {
            if (!prev) return prev
            return {
                ...prev,
                visualSystem: { ...prev.visualSystem, ...updates }
            }
        })
    }

    const updateBrandContext = (updates) => {
        setFormData(prev => {
            if (!prev) return prev
            return {
                ...prev,
                brandContext: { ...prev.brandContext, ...updates }
            }
        })
    }

    const handleSave = () => {
        if (formData) {
            onSave(formData)
        }
    }

    return (
        <div className="editor-page">
            {/* Header */}
            <header className="editor-header">
                <button className="back-btn" onClick={onBack}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

                <div className="header-center">
                    <h1 className="header-title">Brand Kit Editor</h1>
                    {project?.url && (
                        <span className="header-url">{project.url}</span>
                    )}
                </div>

                <button className="btn btn-primary save-btn" onClick={handleSave}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17,21 17,13 7,13 7,21" />
                        <polyline points="7,3 7,8 15,8" />
                    </svg>
                    Save
                </button>
            </header>

            {/* Main Editor Grid */}
            <main className="editor-main">
                <div className="editor-grid">
                    {/* Left Column - Brand Identity */}
                    <section className="editor-column">
                        <BrandIdentity
                            data={formData?.brandIdentity}
                            onChange={updateBrandIdentity}
                        />
                    </section>

                    {/* Middle Column - Visual System */}
                    <section className="editor-column">
                        <VisualSystem
                            data={formData?.visualSystem}
                            onChange={updateVisualSystem}
                        />
                    </section>

                    {/* Right Column - Brand Context */}
                    <section className="editor-column">
                        <BrandContext
                            data={formData?.brandContext}
                            onChange={updateBrandContext}
                        />
                    </section>
                </div>
            </main>
        </div>
    )
}

export default EditorPage
