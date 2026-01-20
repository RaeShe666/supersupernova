import { useRef } from 'react'
import './LogoUpload.css'

// 压缩图片到指定大小
function compressImage(file, maxWidth = 400, quality = 0.8) {
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

function LogoUpload({ logo, onUpload, onRemove }) {
    const inputRef = useRef(null)

    const handleClick = () => {
        inputRef.current?.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            try {
                // 压缩图片后再上传
                const compressed = await compressImage(file)
                onUpload(compressed)
            } catch (error) {
                console.error('Logo upload failed:', error)
                alert('Logo upload failed. Please try a smaller image.')
            }
        }
        // Reset input
        e.target.value = ''
    }

    return (
        <div className="logo-upload">
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            {logo ? (
                <div className="logo-preview">
                    <img src={logo} alt="Brand Logo" />
                    <div className="logo-actions">
                        <button className="logo-action-btn replace" onClick={handleClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17,8 12,3 7,8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Replace
                        </button>
                    </div>
                </div>
            ) : (
                <button className="logo-upload-btn" onClick={handleClick}>
                    <div className="upload-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </div>
                    <span className="upload-text">Upload</span>
                    <span className="upload-hint">No brand logo yet</span>
                </button>
            )}
        </div>
    )
}

export default LogoUpload
