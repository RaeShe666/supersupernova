import { useState, useRef } from 'react'
import './VisualSystem.css'

const APPEARANCE_OPTIONS = [
    {
        id: 'clean-minimal',
        name: 'Clean Minimal',
        image: '/clean-minimal.jpg'
    },
    {
        id: 'gradient',
        name: 'Gradient',
        image: '/gradient.jpg'
    },
    {
        id: 'frosted-glass',
        name: 'Frosted Glass',
        image: '/frosted-glass.jpg'
    },
    {
        id: 'retro-grain',
        name: 'Retro Grain',
        image: '/retro-grain.jpg'
    },
    {
        id: '3d-volume',
        name: '3D Volume',
        image: '/3d-volume.jpg'
    }
]

function VisualSystem({ data, onChange }) {
    const baseAppearance = data?.baseAppearance || 'clean-minimal'
    const customStyles = data?.customStyles || []

    const [showModal, setShowModal] = useState(false)
    const [editingStyle, setEditingStyle] = useState(null) // null = adding new, object = editing
    const [modalName, setModalName] = useState('')
    const [modalImage, setModalImage] = useState(null)
    const fileInputRef = useRef(null)

    // 合并预设和自定义风格
    const allStyles = [...APPEARANCE_OPTIONS, ...customStyles]

    // 打开添加弹窗
    const handleAddClick = () => {
        setEditingStyle(null)
        setModalName('')
        setModalImage(null)
        setShowModal(true)
    }

    // 打开编辑弹窗
    const handleEditCustomStyle = (style, e) => {
        e.stopPropagation()
        setEditingStyle(style)
        setModalName(style.name)
        setModalImage(style.image)
        setShowModal(true)
    }

    // 压缩图片
    const compressImage = (file, maxWidth = 300, quality = 0.7) => {
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

    // 处理图片上传（带压缩）
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            try {
                const compressed = await compressImage(file)
                setModalImage(compressed)
            } catch (error) {
                console.error('Image upload failed:', error)
                alert('Image upload failed. Please try a smaller image.')
            }
        }
        e.target.value = ''
    }

    // 应用更改
    const handleApply = () => {
        if (!modalName.trim() || !modalImage) return

        if (editingStyle) {
            // 编辑现有风格
            const updatedStyles = customStyles.map(s =>
                s.id === editingStyle.id
                    ? { ...s, name: modalName.trim(), image: modalImage }
                    : s
            )
            onChange({ customStyles: updatedStyles })
        } else {
            // 添加新风格并自动选中
            const newStyleId = `custom-${Date.now()}`
            const newStyle = {
                id: newStyleId,
                name: modalName.trim(),
                image: modalImage,
                isCustom: true
            }
            onChange({
                customStyles: [...customStyles, newStyle],
                baseAppearance: newStyleId  // 自动选中新风格
            })
        }
        setShowModal(false)
    }

    // 键盘事件 - Enter 键提交
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && modalName.trim() && modalImage) {
            e.preventDefault()
            handleApply()
        }
    }

    // 删除自定义风格
    const handleDeleteStyle = (styleId, e) => {
        e.stopPropagation()
        const updatedStyles = customStyles.filter(s => s.id !== styleId)
        onChange({ customStyles: updatedStyles })
        // 如果删除的是当前选中的，切换到默认
        if (baseAppearance === styleId) {
            onChange({ baseAppearance: 'clean-minimal', customStyles: updatedStyles })
        }
    }

    return (
        <div className="visual-system">
            <h3 className="section-label">Visual System</h3>

            {/* Base Appearance */}
            <div className="field-group">
                <label className="field-label">Base Appearance</label>
                <div className="appearance-grid">
                    {/* 预设 + 自定义风格 */}
                    {allStyles.map((option) => (
                        <button
                            key={option.id}
                            className={`appearance-option ${baseAppearance === option.id ? 'active' : ''}`}
                            onClick={() => onChange({ baseAppearance: option.id })}
                        >
                            <div className="appearance-thumbnail">
                                <img src={option.image} alt={option.name} className="custom-thumbnail-img" />
                            </div>
                            <span className="appearance-name">{option.name}</span>

                            {/* 自定义风格的编辑/删除按钮 */}
                            {option.isCustom && (
                                <div className="custom-style-actions">
                                    <button
                                        className="style-action-btn edit"
                                        onClick={(e) => handleEditCustomStyle(option, e)}
                                        title="Edit"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="style-action-btn delete"
                                        onClick={(e) => handleDeleteStyle(option.id, e)}
                                        title="Delete"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </button>
                    ))}

                    {/* 添加框 - 只在没有自定义风格时显示 */}
                    {customStyles.length === 0 && (
                        <button className="appearance-option add-style-btn" onClick={handleAddClick}>
                            <div className="appearance-thumbnail add-thumbnail">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </div>
                            <span className="appearance-name">Add Style</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 添加/编辑弹窗 */}
            {showModal && (
                <div className="style-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="style-modal" onClick={(e) => e.stopPropagation()}>
                        <h4 className="modal-title">
                            {editingStyle ? 'Edit Style' : 'Add Custom Style'}
                        </h4>

                        {/* 图片上传区域 */}
                        <div
                            className="modal-image-upload"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
                            {modalImage ? (
                                <img src={modalImage} alt="Preview" className="modal-image-preview" />
                            ) : (
                                <div className="modal-image-placeholder">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21,15 16,10 5,21" />
                                    </svg>
                                    <span>Click to upload image</span>
                                </div>
                            )}
                        </div>

                        {/* 标题输入 */}
                        <input
                            type="text"
                            className="modal-name-input"
                            placeholder="Style name"
                            value={modalName}
                            onChange={(e) => setModalName(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />

                        {/* 按钮 */}
                        <div className="modal-actions">
                            <button
                                className="modal-btn apply"
                                onClick={handleApply}
                                disabled={!modalName.trim() || !modalImage}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VisualSystem
