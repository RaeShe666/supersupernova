import { useState, useEffect, useRef } from 'react'
import './FontPicker.css'

// 50 popular Google Fonts
const BASE_FONT_LIST = [
    'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Lato',
    'Poppins', 'Raleway', 'Nunito', 'Ubuntu', 'Playfair Display',
    'Merriweather', 'Source Sans Pro', 'Oswald', 'Noto Sans', 'Rubik',
    'Work Sans', 'Quicksand', 'Barlow', 'Mulish', 'Karla',
    'Outfit', 'Space Grotesk', 'DM Sans', 'Manrope', 'Sora',
    'Plus Jakarta Sans', 'Figtree', 'Lexend', 'Be Vietnam Pro', 'Albert Sans',
    'PT Sans', 'Noto Serif', 'Libre Franklin', 'IBM Plex Sans', 'Cabin',
    'Josefin Sans', 'Fira Sans', 'Arimo', 'Dosis', 'Titillium Web',
    'Crimson Text', 'Cormorant Garamond', 'Libre Baskerville', 'EB Garamond', 'Lora',
    'Roboto Slab', 'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'IBM Plex Mono'
]

// Load font from Google Fonts
function loadFont(fontName) {
    if (!fontName) return
    const linkId = `font-${fontName.replace(/\s+/g, '-')}`
    if (!document.getElementById(linkId)) {
        const link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`
        document.head.appendChild(link)
    }
}

function FontPicker({ currentFont, onChange, onClose }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [loadedFonts, setLoadedFonts] = useState(new Set())
    const pickerRef = useRef(null)
    const listRef = useRef(null)

    // Build font list - include current font at top if not in base list
    const fontList = (() => {
        if (currentFont && !BASE_FONT_LIST.includes(currentFont)) {
            return [currentFont, ...BASE_FONT_LIST]
        }
        return BASE_FONT_LIST
    })()

    // Filter fonts based on search
    const filteredFonts = fontList.filter(font =>
        font.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Load visible fonts
    useEffect(() => {
        // Load first 10 fonts immediately
        filteredFonts.slice(0, 10).forEach(font => {
            if (!loadedFonts.has(font)) {
                loadFont(font)
                setLoadedFonts(prev => new Set([...prev, font]))
            }
        })
    }, [filteredFonts])

    // Load current font
    useEffect(() => {
        if (currentFont) {
            loadFont(currentFont)
        }
    }, [currentFont])

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    // Load font when scrolling into view
    const handleScroll = () => {
        if (!listRef.current) return
        filteredFonts.forEach(font => {
            if (!loadedFonts.has(font)) {
                loadFont(font)
                setLoadedFonts(prev => new Set([...prev, font]))
            }
        })
    }

    const handleSelect = (font) => {
        loadFont(font)
        onChange(font)
        onClose()
    }

    return (
        <div className="font-picker" ref={pickerRef}>
            <div className="font-picker-search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    placeholder="Search Google Fonts"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="font-picker-list" ref={listRef} onScroll={handleScroll}>
                {filteredFonts.map(font => (
                    <div
                        key={font}
                        className={`font-picker-item ${font === currentFont ? 'active' : ''}`}
                        style={{ fontFamily: `'${font}', sans-serif` }}
                        onClick={() => handleSelect(font)}
                    >
                        {font === currentFont && (
                            <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20,6 9,17 4,12" />
                            </svg>
                        )}
                        <span>{font}</span>
                    </div>
                ))}
            </div>

            <a
                href="https://fonts.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-picker-link"
            >
                Explore more fonts at <span>Google Fonts</span>
            </a>
        </div>
    )
}

export default FontPicker
export { loadFont, BASE_FONT_LIST as FONT_LIST }
