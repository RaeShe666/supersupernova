// Brand Kit Extraction API - Render version
// Handles screenshot + AI analysis + Visual Images extraction

import { Router } from 'express'
import sharp from 'sharp'

const router = Router()

const API_BASE_URL = process.env.API_BASE_URL || 'https://yinli.one/v1'
const API_MODEL = process.env.API_MODEL || 'gemini-3-flash-preview-thinking'

router.get('/extract', async (req, res) => {
    const url = req.query.url

    if (!url) {
        return res.status(400).json({ error: 'URL is required' })
    }

    const API_KEY = process.env.OPENAI_API_KEY

    if (!API_KEY) {
        return res.status(500).json({ error: 'API key not configured' })
    }

    try {
        // Step 1: Take full-page screenshot
        let screenshotBase64 = null
        let screenshotBuffer = null
        let metadata = {}

        try {
            const SCREENSHOT_API_KEY = process.env.SCREENSHOT_API_KEY
            if (SCREENSHOT_API_KEY) {
                const params = new URLSearchParams({
                    access_key: SCREENSHOT_API_KEY,
                    url: url,
                    viewport_width: '1280',
                    viewport_height: '800',
                    format: 'png',
                    full_page: 'true',
                    delay: '3',
                    block_ads: 'true',
                    block_cookie_banners: 'true',
                    image_quality: '80',
                    ignore_host_errors: 'true'
                })

                const screenshotApiUrl = `https://api.screenshotone.com/take?${params.toString()}`
                const screenshotResponse = await fetch(screenshotApiUrl)

                if (screenshotResponse.ok) {
                    const arrayBuffer = await screenshotResponse.arrayBuffer()
                    screenshotBuffer = Buffer.from(arrayBuffer)
                    screenshotBase64 = `data:image/png;base64,${screenshotBuffer.toString('base64')}`
                }
            }

            // Also extract metadata from HTML
            const htmlResponse = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            })
            if (htmlResponse.ok) {
                const html = await htmlResponse.text()
                const baseUrl = new URL(url).origin
                metadata = extractMetadataFromHtml(html, baseUrl)
            }
        } catch (e) {
            console.log('Screenshot/metadata failed, continuing:', e.message)
        }

        // Step 2: Call AI for brand analysis
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
- For colors: You MUST extract EXACTLY 4 colors that are actually used on the website. Analyze the screenshot carefully and identify the 4 most frequently used colors (primary brand color, secondary colors, accent colors, background colors). Do NOT use placeholder colors like #888888 or #000000 unless they are genuinely used. Each color must be a real color visible on the website.
- For typography: Identify the primary font family used.
- For baseAppearance: Choose the style that best matches the visual design.
- For visualAreas: Identify exactly 3 areas. Use yPercent (0-100) for vertical position and heightPercent for height.
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

        // Detect anti-crawl page
        const antiCrawlKeywords = ['access denied', 'forbidden', '403', 'blocked', 'captcha', 'robot', 'not allowed', 'error', 'cloudflare']
        let isAntiCrawl = false

        if (metadata.title) {
            const titleLower = metadata.title.toLowerCase()
            isAntiCrawl = antiCrawlKeywords.some(kw => titleLower.includes(kw))
        }

        // If anti-crawl detected: clear colors, keep screenshot as visual image
        if (isAntiCrawl) {
            brandKit.visualSystem.colors = [] // Empty colors - frontend will show empty circles
            // Use the full screenshot as visual image (showing the error page)
            if (screenshotBase64) {
                brandKit.brandContext.images = [screenshotBase64]
            }
        } else {
            // Normal case: keep first 4 colors
            if (brandKit.visualSystem?.colors) {
                brandKit.visualSystem.colors = brandKit.visualSystem.colors.slice(0, 4)
            }
            // Add visual images to brandContext
            brandKit.brandContext.images = visualImages.map(v => v.image)
        }

        // Add logo from metadata
        if (metadata.logoUrl || metadata.appleTouchIcon || metadata.favicon) {
            brandKit.brandIdentity.logo = metadata.logoUrl || metadata.appleTouchIcon || metadata.favicon
        }

        // Remove visualAreas from response
        delete brandKit.visualAreas

        res.json({
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
})

// Helper functions
function extractMetadataFromHtml(html, baseUrl) {
    const getMatch = (pattern) => {
        const match = pattern.exec(html)
        return match ? match[1] : null
    }

    return {
        title: getMatch(/<title[^>]*>([^<]+)<\/title>/i),
        description: getMatch(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i),
        logoUrl: extractLogoFromHtml(html, baseUrl),
        favicon: resolveUrl(
            getMatch(/<link[^>]*rel="icon"[^>]*href="([^"]+)"/i),
            baseUrl
        ),
        appleTouchIcon: resolveUrl(
            getMatch(/<link[^>]*rel="apple-touch-icon"[^>]*href="([^"]+)"/i),
            baseUrl
        )
    }
}

function extractLogoFromHtml(html, baseUrl) {
    const imgPatterns = [
        /<img[^>]*class="[^"]*logo[^"]*"[^>]*src="([^"]+)"/gi,
        /<img[^>]*src="([^"]*logo[^"]*)"/gi
    ]

    for (const pattern of imgPatterns) {
        const match = pattern.exec(html)
        if (match && match[1]) {
            return resolveUrl(match[1], baseUrl)
        }
    }
    return null
}

function resolveUrl(src, baseUrl) {
    if (!src) return null
    if (src.startsWith('data:')) return src
    if (src.startsWith('http')) return src
    if (src.startsWith('//')) return 'https:' + src
    if (src.startsWith('/')) return baseUrl + src
    return baseUrl + '/' + src
}

export default router
