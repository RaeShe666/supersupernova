// Brand Kit Extraction API
// Handles screenshot + AI analysis + Visual Images extraction

import sharp from 'sharp'
import { URL } from 'url'

export const config = {
    runtime: 'nodejs',
    maxDuration: 60
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    const url = req.query.url || req.body?.url

    if (!url) {
        return res.status(400).json({ error: 'URL is required' })
    }

    const API_KEY = process.env.OPENAI_API_KEY
    const API_BASE_URL = process.env.API_BASE_URL || 'https://yinli.one/v1'
    const API_MODEL = process.env.API_MODEL || 'gemini-3-flash-preview-thinking'

    if (!API_KEY) {
        return res.status(500).json({ error: 'API key not configured' })
    }

    try {
        // Step 1: Take full-page screenshot
        let screenshotBase64 = null
        let screenshotBuffer = null
        let metadata = {}

        try {
            const screenshotRes = await fetch(`${getBaseUrl(req)}/api/screenshot?url=${encodeURIComponent(url)}`)
            const screenshotData = await screenshotRes.json()
            if (screenshotData.success) {
                screenshotBase64 = screenshotData.screenshot
                metadata = screenshotData.metadata || {}

                // Convert base64 to buffer for Sharp
                const base64Data = screenshotBase64.replace(/^data:image\/\w+;base64,/, '')
                screenshotBuffer = Buffer.from(base64Data, 'base64')
            }
        } catch (e) {
            console.log('Screenshot failed, continuing without image:', e.message)
        }

        // Step 2: Call AI for brand analysis + visual areas detection
        const systemPrompt = `You are a brand analyst expert. Analyze the given website screenshot and extract:
1. Brand kit information (name, tagline, colors, typography, etc.)
2. Identify 3 key visual areas that best represent the brand's positioning, features, and highlights.

Return your analysis as a JSON object with exactly this structure:
{
    "brandIdentity": {
        "name": "Brand/Company/Product name",
        "tagline": "Main tagline or slogan"
    },
    "visualSystem": {
        "colors": ["#primary", "#secondary1", "#secondary2", "#secondary3"],
        "typography": "Font Family Name",
        "baseAppearance": "clean-minimal|gradient|frosted-glass|retro-grain|3d-volume"
    },
    "brandContext": {
        "overview": "Brief description of what the brand does",
        "keywords": ["keyword1", "keyword2", "keyword3"],
        "tones": ["Professional", "Friendly", "Bold"]
    },
    "visualAreas": [
        {
            "name": "Hero Section",
            "description": "Main hero area showing core product/value proposition",
            "yPercent": 0,
            "heightPercent": 15
        },
        {
            "name": "Feature Showcase", 
            "description": "Key features or benefits display",
            "yPercent": 20,
            "heightPercent": 20
        },
        {
            "name": "Product Display",
            "description": "Product images or service demonstration",
            "yPercent": 45,
            "heightPercent": 20
        }
    ]
}

Guidelines:
- For colors: Extract the 4 most prominent colors as hex codes from the screenshot.
- For typography: Identify the primary font family used.
- For baseAppearance: Choose the style that best matches the visual design.
- For visualAreas: Identify exactly 3 areas. Use yPercent (0-100) for vertical position and heightPercent for height, where 100% is the full page height.
- Choose visual areas that best represent: brand positioning, core features/products, and visual highlights.
- Return ONLY valid JSON, no additional text.`

        const messages = [
            { role: 'system', content: systemPrompt }
        ]

        if (screenshotBase64) {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: `Analyze this full-page website screenshot and extract the brand kit plus identify 3 key visual areas: ${url}` },
                    { type: 'image_url', image_url: { url: screenshotBase64 } }
                ]
            })
        } else {
            messages.push({
                role: 'user',
                content: `Analyze this website and extract the brand kit based on your knowledge: ${url}`
            })
        }

        const aiResponse = await fetch(`${API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: API_MODEL,
                messages: messages,
                max_tokens: 4000,
                temperature: 0.3
            })
        })

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text()
            console.error('AI API Error:', errorText)
            throw new Error('AI analysis failed')
        }

        const aiData = await aiResponse.json()
        const content = aiData.choices[0]?.message?.content

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('No valid JSON in AI response')
        }

        const brandKit = JSON.parse(jsonMatch[0])

        // Step 3: Crop visual areas from screenshot
        let visualImages = []
        if (screenshotBuffer && brandKit.visualAreas && brandKit.visualAreas.length > 0) {
            try {
                const imageInfo = await sharp(screenshotBuffer).metadata()
                const { width, height } = imageInfo

                for (const area of brandKit.visualAreas.slice(0, 3)) {
                    const yStart = Math.floor((area.yPercent / 100) * height)
                    const areaHeight = Math.floor((area.heightPercent / 100) * height)

                    // Ensure we don't exceed image bounds
                    const safeY = Math.min(yStart, height - 100)
                    const safeHeight = Math.min(areaHeight, height - safeY)

                    if (safeHeight > 50) {
                        const croppedBuffer = await sharp(screenshotBuffer)
                            .extract({
                                left: 0,
                                top: safeY,
                                width: width,
                                height: safeHeight
                            })
                            .resize({ width: 800, withoutEnlargement: true })
                            .jpeg({ quality: 80 })
                            .toBuffer()

                        visualImages.push({
                            name: area.name,
                            description: area.description,
                            image: `data:image/jpeg;base64,${croppedBuffer.toString('base64')}`
                        })
                    }
                }
            } catch (cropError) {
                console.error('Cropping failed:', cropError.message)
            }
        }

        // Ensure tones is an array
        if (brandKit.brandContext && typeof brandKit.brandContext.tone === 'string') {
            brandKit.brandContext.tones = [brandKit.brandContext.tone]
            delete brandKit.brandContext.tone
        }

        // Ensure 4 colors
        if (brandKit.visualSystem?.colors?.length < 4) {
            while (brandKit.visualSystem.colors.length < 4) {
                brandKit.visualSystem.colors.push('#888888')
            }
        }

        // Add logo from metadata
        if (metadata.logoUrl || metadata.appleTouchIcon || metadata.favicon) {
            brandKit.brandIdentity.logo = metadata.logoUrl || metadata.appleTouchIcon || metadata.favicon
        }

        // Add visual images to brandContext (convert to simple string array)
        brandKit.brandContext.images = visualImages.map(v => v.image)

        // Remove visualAreas from response (internal data)
        delete brandKit.visualAreas

        res.status(200).json({
            success: true,
            data: brandKit,
            hasScreenshot: !!screenshotBase64,
            hasVisualImages: visualImages.length > 0,
            visualImagesCount: visualImages.length
        })

    } catch (error) {
        console.error('Extract error:', error)
        res.status(500).json({
            error: 'Extraction failed',
            message: error.message
        })
    }
}

function getBaseUrl(req) {
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers['x-forwarded-host'] || req.headers.host
    return `${protocol}://${host}`
}
