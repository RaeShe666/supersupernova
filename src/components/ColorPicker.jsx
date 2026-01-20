import { useState, useRef, useEffect } from 'react'
import './ColorPicker.css'

// Convert HSV to Hex
function hsvToHex(h, s, v) {
    s /= 100
    v /= 100
    const f = (n) => {
        const k = (n + h / 60) % 6
        return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))))
    }
    return `#${f(5).toString(16).padStart(2, '0')}${f(3).toString(16).padStart(2, '0')}${f(1).toString(16).padStart(2, '0')}`.toUpperCase()
}

// Convert Hex to HSV
function hexToHsv(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const v = max
    const d = max - min
    const s = max === 0 ? 0 : d / max

    let h = 0
    if (max !== min) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
            case g: h = ((b - r) / d + 2) * 60; break
            case b: h = ((r - g) / d + 4) * 60; break
        }
    }
    return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) }
}

function ColorPicker({ color, onChange, onClose }) {
    const [hsv, setHsv] = useState(() => hexToHsv(color))
    const [hexInput, setHexInput] = useState(color.toUpperCase())
    const pickerRef = useRef(null)
    const areaRef = useRef(null)
    const isDragging = useRef(false)

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

    // Update parent color in real-time when HSV changes
    useEffect(() => {
        const newHex = hsvToHex(hsv.h, hsv.s, hsv.v)
        setHexInput(newHex)
        onChange(newHex) // Real-time update
    }, [hsv])

    const handleHueChange = (e) => {
        setHsv(prev => ({ ...prev, h: parseInt(e.target.value) }))
    }

    const handleHexInput = (e) => {
        const value = e.target.value.toUpperCase()
        setHexInput(value)
        if (/^#[0-9A-F]{6}$/.test(value)) {
            setHsv(hexToHsv(value))
        }
    }

    const handleAreaMouseDown = (e) => {
        isDragging.current = true
        updateFromArea(e)
    }

    const handleMouseMove = (e) => {
        if (isDragging.current) {
            updateFromArea(e)
        }
    }

    const handleMouseUp = () => {
        isDragging.current = false
    }

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    const updateFromArea = (e) => {
        if (!areaRef.current) return
        const rect = areaRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))

        setHsv(prev => ({
            ...prev,
            s: Math.round(x * 100),
            v: Math.round((1 - y) * 100)
        }))
    }

    return (
        <div className="color-picker" ref={pickerRef}>
            {/* Header with Hex Input */}
            <div className="picker-header">
                <div className="eyedropper-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 22l1-1h3l9-9" />
                        <path d="M3 21v-3l9-9" />
                        <path d="M14.5 5.5l4 4" />
                        <path d="M18.5 9.5l-4-4" />
                        <path d="M22 2l-4 4" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="hex-input"
                    value={hexInput}
                    onChange={handleHexInput}
                    maxLength={7}
                />
            </div>

            {/* Hue Slider */}
            <div className="hue-slider-container">
                <input
                    type="range"
                    className="hue-slider"
                    min="0"
                    max="360"
                    value={hsv.h}
                    onChange={handleHueChange}
                />
            </div>

            {/* Color Area */}
            <div
                className="color-area"
                ref={areaRef}
                style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                onMouseDown={handleAreaMouseDown}
            >
                <div className="saturation-overlay"></div>
                <div className="value-overlay"></div>
                <div
                    className="area-cursor"
                    style={{
                        left: `${hsv.s}%`,
                        top: `${100 - hsv.v}%`
                    }}
                />
            </div>
        </div>
    )
}

export default ColorPicker
