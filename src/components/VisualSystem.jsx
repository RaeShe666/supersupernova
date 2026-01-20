import './VisualSystem.css'

const APPEARANCE_OPTIONS = [
    {
        id: 'clean-minimal',
        name: 'Clean Minimal',
        gradient: 'linear-gradient(135deg, #FFF8F6, #FFEEE9)',
        icon: '□'
    },
    {
        id: 'gradient',
        name: 'Gradient',
        gradient: 'linear-gradient(135deg, #FF9A6C, #FF6B95, #A855F7)',
        icon: '◐'
    },
    {
        id: 'frosted-glass',
        name: 'Frosted Glass',
        gradient: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(200,220,240,0.6))',
        icon: '◇'
    },
    {
        id: 'retro-grain',
        name: 'Retro Grain',
        gradient: 'linear-gradient(135deg, #E8B4A0, #D4A574)',
        icon: '▤'
    },
    {
        id: '3d-volume',
        name: '3D Volume',
        gradient: 'linear-gradient(135deg, #C4D6E8, #9DB5D1, #7AA3C7)',
        icon: '◆'
    }
]

function VisualSystem({ data, onChange }) {
    const baseAppearance = data?.baseAppearance || 'clean-minimal'

    return (
        <div className="visual-system">
            <h3 className="section-label">Visual System</h3>

            {/* Base Appearance */}
            <div className="field-group">
                <label className="field-label">Base Appearance</label>
                <div className="appearance-list">
                    {APPEARANCE_OPTIONS.map((option) => (
                        <button
                            key={option.id}
                            className={`appearance-option ${baseAppearance === option.id ? 'active' : ''}`}
                            onClick={() => onChange({ baseAppearance: option.id })}
                        >
                            <div
                                className={`appearance-thumbnail`}
                                style={{ background: option.gradient }}
                            >
                                <span className="appearance-icon">{option.icon}</span>
                            </div>
                            <span className="appearance-name">{option.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default VisualSystem
