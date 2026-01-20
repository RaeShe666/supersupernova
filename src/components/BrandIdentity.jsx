import { useState, useEffect } from 'react'
import LogoUpload from './LogoUpload'
import ColorPicker from './ColorPicker'
import FontPicker, { loadFont } from './FontPicker'
import './BrandIdentity.css'

function BrandIdentity({ data, onChange }) {
    const [activeColorIndex, setActiveColorIndex] = useState(null)
    const [showFontPicker, setShowFontPicker] = useState(false)

    const colors = data?.colors || ['#FF6B4A', '#4A7BF7', '#22C55E', '#9333EA']
    const typography = data?.typography || 'Inter'

    // Load the current font on mount
    useEffect(() => {
        if (typography) {
            loadFont(typography)
        }
    }, [typography])

    const handleColorChange = (index, newColor) => {
        const newColors = [...colors]
        newColors[index] = newColor
        onChange({ colors: newColors })
        // Picker stays open - user closes by clicking outside
    }

    const handleFontChange = (fontName) => {
        onChange({ typography: fontName })
    }

    return (
        <div className="brand-identity">
            <h3 className="section-label">Brand Identity</h3>

            {/* Name */}
            <div className="field-group">
                <label className="field-label">
                    Name <span className="required">*</span>
                </label>
                <input
                    type="text"
                    className="input"
                    placeholder="Enter your brand name"
                    value={data?.name || ''}
                    onChange={(e) => onChange({ name: e.target.value })}
                />
            </div>

            {/* Logo Upload */}
            <div className="field-group">
                <label className="field-label">Logo</label>
                <LogoUpload
                    logo={data?.logo}
                    onUpload={(logo) => onChange({ logo })}
                    onRemove={() => onChange({ logo: null })}
                />
            </div>

            {/* Tagline */}
            <div className="field-group">
                <label className="field-label">Tagline</label>
                <textarea
                    className="tagline-textarea"
                    placeholder="A short product slogan"
                    value={data?.tagline || ''}
                    onChange={(e) => onChange({ tagline: e.target.value })}
                />
            </div>

            {/* Color System - 4 colors */}
            <div className="field-group">
                <label className="field-label">Color</label>
                <div className="color-system">
                    {(colors.length > 0 ? colors : [null, null, null, null]).map((color, index) => (
                        <div key={index} className="color-item">
                            <button
                                className={`color-dot ${index === 0 ? 'primary' : 'secondary'} ${!color ? 'empty' : ''} ${activeColorIndex === index ? 'active' : ''}`}
                                style={color ? { backgroundColor: color } : {}}
                                onClick={() => color && setActiveColorIndex(activeColorIndex === index ? null : index)}
                                title={!color ? 'No color extracted' : (index === 0 ? 'Primary Color' : `Secondary Color ${index}`)}
                                disabled={!color}
                            />
                            {activeColorIndex === index && color && (
                                <ColorPicker
                                    color={color}
                                    onChange={(newColor) => handleColorChange(index, newColor)}
                                    onClose={() => setActiveColorIndex(null)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Typography - Font Picker */}
            <div className="field-group">
                <label className="field-label">Typography</label>
                <div className="typography-display-container">
                    <div
                        className="typography-display"
                        onClick={() => setShowFontPicker(!showFontPicker)}
                    >
                        <div
                            className="typography-preview-text"
                            style={{ fontFamily: `'${typography}', sans-serif` }}
                        >
                            Aa
                        </div>
                        <div className="typography-font-name">{typography}</div>
                        <div className="typography-edit-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </div>
                    </div>
                    {showFontPicker && (
                        <FontPicker
                            currentFont={typography}
                            onChange={handleFontChange}
                            onClose={() => setShowFontPicker(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default BrandIdentity
