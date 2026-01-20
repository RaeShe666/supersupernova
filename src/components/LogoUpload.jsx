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

function LogoUpload({ logo, onUpload }) {
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
        <div className="logo-card" onClick={handleClick}>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            {logo ? (
                <img src={logo} alt="Brand Logo" className="logo-image" />
            ) : (
                <div className="logo-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </div>
            )}
            <div className="card-edit-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
            </div>
        </div>
    )
}

export default LogoUpload
