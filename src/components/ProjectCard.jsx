import './ProjectCard.css'

function ProjectCard({ project, onClick, onDelete }) {
    const colors = project.brandIdentity?.colors || ['#ccc', '#ddd', '#eee', '#f5f5f5']
    const logo = project.brandIdentity?.logo
    const name = project.brandIdentity?.name || 'Untitled Project'

    const handleDelete = (e) => {
        e.stopPropagation()
        if (confirm('Delete this project?')) {
            onDelete()
        }
    }

    return (
        <div className="project-card" onClick={onClick}>
            {/* Delete Button */}
            <button className="project-delete-btn" onClick={handleDelete}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19,6v14a2,2 0,0 1,-2,2H7a2,2 0,0 1,-2,-2V6m3,0V4a2,2 0,0 1,2,-2h4a2,2 0,0 1,2,2v2" />
                </svg>
            </button>

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

            {/* Project Name */}
            <div className="project-name">{name}</div>
        </div>
    )
}

export default ProjectCard
