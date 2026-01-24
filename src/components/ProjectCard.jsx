import { useState } from 'react'
import { createPortal } from 'react-dom'
import './ProjectCard.css'

function ProjectCard({ project, onClick, onDelete }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const colors = project.brandIdentity?.colors || ['#ccc', '#ddd', '#eee', '#f5f5f5']
    const logo = project.brandIdentity?.logo
    const name = project.brandIdentity?.name || 'Untitled Project'

    // Format date as "22 Jan. 2026 · 23:01"
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const day = date.getDate()
        const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
        const month = monthNames[date.getMonth()]
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${day} ${month} ${year} · ${hours}:${minutes}`
    }

    const displayDate = project.updatedAt || project.createdAt

    const handleDeleteClick = (e) => {
        e.stopPropagation()
        setShowDeleteModal(true)
    }

    const handleConfirmDelete = () => {
        setShowDeleteModal(false)
        onDelete()
    }

    const handleCancelDelete = (e) => {
        e.stopPropagation()
        setShowDeleteModal(false)
    }

    return (
        <div className="project-card" onClick={onClick}>
            {/* Logo Section */}
            <div className="project-logo-section">
                {logo ? (
                    <img src={logo} alt={name} className="project-logo" />
                ) : (
                    <div className="project-logo-placeholder">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21,15 16,10 5,21" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Colors Section */}
            <div className="project-colors-section">
                <div className="project-colors">
                    {colors.slice(0, 4).map((color, index) => (
                        <div
                            key={index}
                            className="project-color-dot"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            {/* Footer: Name, Date, Delete Button */}
            <div className="project-footer">
                <div className="project-info">
                    <div className="project-name">{name}</div>
                    <div className="project-date">{formatDate(displayDate)}</div>
                </div>

                {/* Trash icon delete button */}
                <button className="project-delete-btn" onClick={handleDeleteClick}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6" />
                        <path d="M19,6v14a2,2 0,0 1,-2,2H7a2,2 0,0 1,-2,-2V6m3,0V4a2,2 0,0 1,2,-2h4a2,2 0,0 1,2,2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                </button>
            </div>

            {/* Delete Confirmation Modal - rendered via Portal to body */}
            {showDeleteModal && createPortal(
                <div className="delete-modal-overlay" onClick={handleCancelDelete}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-modal-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h3 className="delete-modal-title">Delete Project</h3>
                        <p className="delete-modal-message">
                            Are you sure you want to delete this project?<br />
                            This action cannot be undone.
                        </p>
                        <div className="delete-modal-actions">
                            <button className="delete-modal-btn cancel" onClick={handleCancelDelete}>
                                Cancel
                            </button>
                            <button className="delete-modal-btn confirm" onClick={handleConfirmDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

export default ProjectCard
