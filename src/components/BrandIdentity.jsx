import { useState, useEffect } from 'react'
import LogoUpload from './LogoUpload'
import ColorPicker from './ColorPicker'
import FontPicker, { loadFont } from './FontPicker'
import './BrandIdentity.css'

function BrandIdentity({ data, onChange }) {
    const [activeColorIndex, setActiveColorIndex] = useState(null)
    const [showFontPicker, setShowFontPicker] = useState(false)

    const colors = data?.colors || ['#f9f6f5ff', '#eceef0ff', '#f4f8f6ff', '#f8f6faff']
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

            {/* Logo + Typography Row */}
            <div className="field-group">
                <div className="logo-font-row">
                    {/* Logo Column */}
                    <div className="logo-column">
                        <label className="field-label">Logo</label>
                        <LogoUpload
                            logo={data?.logo}
                            onUpload={(logo) => onChange({ logo })}
                        />
                    </div>

                    {/* Font Column */}
                    <div className="font-column">
                        <label className="field-label">Typography</label>
                        <div className="font-card" onClick={() => setShowFontPicker(!showFontPicker)}>
                            <div
                                className="font-preview"
                                style={{ fontFamily: `'${typography}', sans-serif` }}
                            >
                                Aa
                            </div>
                            <span className="font-name">{typography}</span>
                            <div className="card-edit-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                            </div>
                        </div>
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
        </div>
    )
}

export default BrandIdentity
