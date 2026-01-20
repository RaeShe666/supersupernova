import { useRef } from 'react'
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

function ImageGallery({ images, onAdd, onRemove, maxImages }) {
    const inputRef = useRef(null)

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
                        <img src={image} alt={`Visual ${index + 1}`} />
                        <button
                            className="gallery-remove-btn"
                            onClick={() => onRemove(index)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3,6 5,6 21,6" />
                                <path d="M19,6v14a2,2 0,0 1,-2,2H7a2,2 0,0 1,-2,-2V6m3,0V4a2,2 0,0 1,2,-2h4a2,2 0,0 1,2,2v2" />
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
        </div>
    )
}

export default ImageGallery
