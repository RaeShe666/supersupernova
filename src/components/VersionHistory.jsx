import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import './VersionHistory.css'

function VersionHistory({ projectId, onRestore, onClose }) {
    const [versions, setVersions] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedVersion, setSelectedVersion] = useState(null)
    const [restoring, setRestoring] = useState(false)

    // Load versions from Supabase
    useEffect(() => {
        async function loadVersions() {
            try {
                const { data, error } = await supabase
                    .from('project_versions')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('version_number', { ascending: false })

                if (error) throw error
                setVersions(data || [])
            } catch (err) {
                console.error('Failed to load versions:', err)
            } finally {
                setLoading(false)
            }
        }

        if (projectId) {
            loadVersions()
        }
    }, [projectId])

    const handleRestore = async () => {
        if (!selectedVersion) return

        setRestoring(true)
        try {
            // Call onRestore with the version data
            await onRestore(selectedVersion.data)
            onClose()
        } catch (err) {
            console.error('Failed to restore version:', err)
        } finally {
            setRestoring(false)
        }
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatTime = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="version-history">
            <div className="version-history-header">
                <h3 className="version-history-title">Version History</h3>
                <button className="version-close-btn" onClick={onClose}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <div className="version-list">
                {loading ? (
                    <div className="version-loading">
                        <div className="btn-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                    </div>
                ) : versions.length === 0 ? (
                    <div className="version-empty">
                        <div className="version-empty-icon">📝</div>
                        <p className="version-empty-text">
                            No version history yet.<br />
                            Make some edits to create versions.
                        </p>
                    </div>
                ) : (
                    versions.map((version) => (
                        <div
                            key={version.id}
                            className={`version-item ${selectedVersion?.id === version.id ? 'current' : ''}`}
                            onClick={() => setSelectedVersion(version)}
                        >
                            <div className="version-number">v{version.version_number}</div>
                            <div className="version-info">
                                <p className="version-date">{formatDate(version.created_at)}</p>
                                <p className="version-time">{formatTime(version.created_at)}</p>
                            </div>
                            {version.version_number === versions[0]?.version_number && (
                                <span className="version-badge">Latest</span>
                            )}
                        </div>
                    ))
                )}
            </div>

            {versions.length > 0 && (
                <div className="version-actions">
                    <button
                        className="version-restore-btn"
                        onClick={handleRestore}
                        disabled={!selectedVersion || restoring}
                    >
                        {restoring ? 'Restoring...' : 'Restore Selected Version'}
                    </button>
                </div>
            )}
        </div>
    )
}

export default VersionHistory
