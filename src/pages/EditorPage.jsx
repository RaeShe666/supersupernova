import { useState, useEffect, useRef, useCallback } from 'react'
import BrandIdentity from '../components/BrandIdentity'
import VisualSystem from '../components/VisualSystem'
import BrandContext from '../components/BrandContext'
import { supabase } from '../supabaseClient'
import './EditorPage.css'

function EditorPage({ project, onSave, onBack }) {
    const [formData, setFormData] = useState(project)
    const isInitialMount = useRef(true)
    const saveTimeoutRef = useRef(null)

    // 仅在 project 变化时同步（不是每次父组件更新都同步）
    useEffect(() => {
        if (project?.id !== formData?.id) {
            setFormData(project)
        }
    }, [project?.id])

    // 保存到数据库的函数
    const saveToDatabase = useCallback(async (data) => {
        if (!data?.id) return

        try {
            const { id, url, createdAt, ...projectData } = data
            const { error } = await supabase
                .from('projects')
                .update({
                    name: projectData.brandIdentity?.name || '',
                    data: projectData
                })
                .eq('id', id)

            if (error) throw error

            // 同步到父组件
            onSave(data)
        } catch (err) {
            console.error('Failed to save to Supabase:', err)
            if (err.message && err.message.includes('policy')) {
                alert('Save failed: Database permission denied (RLS policy). Please check Supabase policies.')
            } else if (err.code === '403' || err.code === '401') {
                alert('Save failed: Permission denied. Code: ' + err.code)
            } else {
                // catch-all for other errors
                console.warn('Save error:', err)
            }
        }
    }, [onSave])

    // 自动保存：formData 变化时使用防抖保存（跳过首次挂载）
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }

        if (!formData) return

        // 清除之前的定时器
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        // 500ms 防抖保存
        saveTimeoutRef.current = setTimeout(() => {
            saveToDatabase(formData)
        }, 500)

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [formData, saveToDatabase])

    // 页面卸载前立即保存
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (formData) {
                // 立即保存
                const { id, url, createdAt, ...projectData } = formData
                supabase
                    .from('projects')
                    .update({
                        name: projectData.brandIdentity?.name || '',
                        data: projectData
                    })
                    .eq('id', id)
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
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

    // 手动保存并返回
    const handleSaveAndBack = async () => {
        if (formData) {
            await saveToDatabase(formData)
        }
        onBack()
    }

    return (
        <div className="editor-page">
            {/* Header */}
            <header className="editor-header">
                <button className="save-btn" onClick={handleSaveAndBack}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17,21 17,13 7,13 7,21" />
                        <polyline points="7,3 7,8 15,8" />
                    </svg>
                    Save
                </button>

                <div className="header-center">
                    <h1 className="header-title">Brand Kit Editor</h1>
                    {project?.url && (
                        <span className="header-url">{project.url}</span>
                    )}
                </div>

                {/* Placeholder for right side alignment */}
                <div style={{ width: 100 }}></div>
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
