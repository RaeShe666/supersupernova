import { useRef, useState, useEffect } from 'react'
import './ImageGallery.css'

// 压缩图片到指定大小
function compressImage(file, maxWidth = 300, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // 按比例缩放
                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)

                // 转为压缩后的 base64
                const compressed = canvas.toDataURL('image/jpeg', quality)
                resolve(compressed)
            }
            img.src = e.target.result
        }
        reader.readAsDataURL(file)
    })
}

// Image Lightbox Component - 点击图片放大显示的浮层
function ImageLightbox({ image, onClose }) {
    const lightboxRef = useRef(null)

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (lightboxRef.current && !lightboxRef.current.contains(e.target)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    // ESC key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    return (
        <div className="image-lightbox-overlay">
            <div className="image-lightbox" ref={lightboxRef}>
                <img src={image} alt="Full size preview" />
                <button className="lightbox-close-btn" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    )
}

function ImageGallery({ images, onAdd, onRemove, maxImages }) {
    const inputRef = useRef(null)
    const [lightboxImage, setLightboxImage] = useState(null)

    const handleClick = () => {
        if (images.length < maxImages) {
            inputRef.current?.click()
        }
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            try {
                // 压缩图片后再上传
                const compressed = await compressImage(file)
                onAdd(compressed)
            } catch (error) {
                console.error('Image upload failed:', error)
                alert('Image upload failed. Please try a smaller image.')
            }
        }
        e.target.value = ''
    }

    const handleImageClick = (image, e) => {
        // 阻止冒泡，避免触发其他事件
        e.stopPropagation()
        setLightboxImage(image)
    }

    return (
        <div className="image-gallery">
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            <div className="gallery-grid">
                {/* Existing Images */}
                {images.map((image, index) => (
                    <div key={index} className="gallery-item">
                        <img
                            src={image}
                            alt={`Visual ${index + 1}`}
                            onClick={(e) => handleImageClick(image, e)}
                            style={{ cursor: 'pointer' }}
                        />
                        <button
                            className="gallery-remove-btn"
                            onClick={(e) => {
                                e.stopPropagation()
                                onRemove(index)
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                ))}

                {/* Add Button */}
                {images.length < maxImages && (
                    <button className="gallery-add-btn" onClick={handleClick}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Upload</span>
                    </button>
                )}
            </div>

            <span className="gallery-count">{images.length}/{maxImages}</span>

            {/* Image Lightbox */}
            {lightboxImage && (
                <ImageLightbox
                    image={lightboxImage}
                    onClose={() => setLightboxImage(null)}
                />
            )}
        </div>
    )
}

export default ImageGallery

