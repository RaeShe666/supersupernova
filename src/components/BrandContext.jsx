import { useState } from 'react'
import ImageGallery from './ImageGallery'
import './BrandContext.css'

function BrandContext({ data, onChange }) {
    const [newKeyword, setNewKeyword] = useState('')
    const [newTone, setNewTone] = useState('')

    const keywords = data?.keywords || []
    const tones = data?.tones || []
    const images = data?.images || []

    // Keywords handlers
    const handleAddKeyword = () => {
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            onChange({ keywords: [...keywords, newKeyword.trim()] })
            setNewKeyword('')
        }
    }

    const handleRemoveKeyword = (keyword) => {
        onChange({ keywords: keywords.filter(k => k !== keyword) })
    }

    const handleKeywordKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddKeyword()
        }
    }

    // Tone handlers
    const handleAddTone = () => {
        if (newTone.trim() && !tones.includes(newTone.trim())) {
            onChange({ tones: [...tones, newTone.trim()] })
            setNewTone('')
        }
    }

    const handleRemoveTone = (tone) => {
        onChange({ tones: tones.filter(t => t !== tone) })
    }

    const handleToneKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddTone()
        }
    }

    // Image handlers
    const handleAddImage = (imageData) => {
        if (images.length < 6) {
            onChange({ images: [...images, imageData] })
        }
    }

    const handleRemoveImage = (index) => {
        onChange({ images: images.filter((_, i) => i !== index) })
    }

    return (
        <div className="brand-context">
            <h3 className="section-label">Brand Context</h3>

            {/* Overview */}
            <div className="field-group">
                <label className="field-label">Overview</label>
                <div className="textarea-wrapper">
                    <textarea
                        className="textarea"
                        placeholder="A concise product description to give AI background knowledge..."
                        value={data?.overview || ''}
                        onChange={(e) => onChange({ overview: e.target.value })}
                    />
                </div>
            </div>

            {/* Positioning Keywords */}
            <div className="field-group">
                <label className="field-label">Positioning Keyword</label>
                <p className="field-hint">Audience, Value, Features, Highlights</p>
                <div className="keywords-container">
                    <div className="keyword-input-row">
                        <input
                            type="text"
                            className="keyword-input"
                            placeholder="Add keyword..."
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onKeyDown={handleKeywordKeyDown}
                        />
                        <button
                            className="btn btn-accent add-keyword-btn"
                            onClick={handleAddKeyword}
                            disabled={!newKeyword.trim()}
                        >
                            + Add
                        </button>
                    </div>
                    <div className="keywords-list">
                        {keywords.map((keyword) => (
                            <span key={keyword} className="keyword-tag">
                                <button
                                    className="keyword-remove"
                                    onClick={() => handleRemoveKeyword(keyword)}
                                >
                                    {keyword}
                                </button>
                                <span className="keyword-x">×</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Brand Tone */}
            <div className="field-group">
                <label className="field-label">Brand Tone</label>
                <div className="keywords-container">
                    <div className="keyword-input-row">
                        <input
                            type="text"
                            className="keyword-input"
                            placeholder="Add tone..."
                            value={newTone}
                            onChange={(e) => setNewTone(e.target.value)}
                            onKeyDown={handleToneKeyDown}
                        />
                        <button
                            className="btn btn-accent add-keyword-btn"
                            onClick={handleAddTone}
                            disabled={!newTone.trim()}
                        >
                            + Add
                        </button>
                    </div>
                    <div className="keywords-list">
                        {tones.map((tone) => (
                            <span key={tone} className="keyword-tag">
                                <button
                                    className="keyword-remove"
                                    onClick={() => handleRemoveTone(tone)}
                                >
                                    {tone}
                                </button>
                                <span className="keyword-x">×</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Visual Images */}
            <div className="field-group">
                <label className="field-label">Visual Images</label>
                <ImageGallery
                    images={images}
                    onAdd={handleAddImage}
                    onRemove={handleRemoveImage}
                    maxImages={6}
                />
            </div>
        </div>
    )
}

export default BrandContext
