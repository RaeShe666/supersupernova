// Brand Kit Extraction API - Render version
// Handles screenshot + AI analysis + Visual Images extraction

import { Router } from 'express'
import sharp from 'sharp'

const router = Router()

const API_BASE_URL = process.env.API_BASE_URL || 'https://yinli.one/v1'
const API_MODEL = process.env.API_MODEL || 'gemini-3-flash-preview-thinking'

// Helper: Extract metadata from HTML (fallback when screenshot fails)
function extractMetadataFromHtml(html, baseUrl) {
    const metadata = {
        title: '',
        description: '',
        ogImage: null,
        favicon: null,
        themeColor: null
    }

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) metadata.title = titleMatch[1].trim()

    // Meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
    if (descMatch) metadata.description = descMatch[1].trim()

    // OG Image
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    if (ogImageMatch) metadata.ogImage = resolveUrl(ogImageMatch[1], baseUrl)

    // Favicon
    const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i)
        || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:icon|shortcut icon)["']/i)
    if (faviconMatch) {
        metadata.favicon = resolveUrl(faviconMatch[1], baseUrl)
    } else {
        // Default favicon path
        try {
            const urlObj = new URL(baseUrl)
            metadata.favicon = `${urlObj.origin}/favicon.ico`
        } catch (e) { }
    }

    // Theme color
    const themeMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)
    if (themeMatch) metadata.themeColor = themeMatch[1]

    return metadata
}

// Helper: Resolve relative URLs to absolute
function resolveUrl(url, baseUrl) {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url
    }
    try {
        return new URL(url, baseUrl).href
    } catch (e) {
        return null
    }
}

// Helper: Extract logo URL from HTML
function extractLogoFromHtml(html, baseUrl) {
    // Priority 1: Apple touch icon (usually high quality)
    const appleTouchMatch = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i)
        || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i)
    if (appleTouchMatch) {
        return resolveUrl(appleTouchMatch[1], baseUrl)
    }

    // Priority 2: Large favicon (32x32 or larger)
    const largeFaviconMatch = html.match(/<link[^>]+rel=["']icon["'][^>]+sizes=["'](?:32x32|48x48|64x64|96x96|128x128|192x192|256x256|512x512)["'][^>]+href=["']([^"']+)["']/i)
    if (largeFaviconMatch) {
        return resolveUrl(largeFaviconMatch[1], baseUrl)
    }

    // Priority 3: Standard favicon
    const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i)
        || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:icon|shortcut icon)["']/i)
    if (faviconMatch) {
        return resolveUrl(faviconMatch[1], baseUrl)
    }

    // Priority 4: Img tag with logo class or id
    const logoImgMatch = html.match(/<img[^>]+(?:class|id)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i)
        || html.match(/<img[^>]+src=["']([^"']+)["'][^>]+(?:class|id)=["'][^"']*logo[^"']*["']/i)
    if (logoImgMatch) {
        return resolveUrl(logoImgMatch[1], baseUrl)
    }

    // Fallback: default favicon path
    try {
        const urlObj = new URL(baseUrl)
        return `${urlObj.origin}/favicon.ico`
    } catch (e) {
        return null
    }
}

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
        // Step 1: Take full-page screenshot using ScreenshotOne
        let screenshotBase64 = null
        let screenshotBuffer = null
        let htmlMetadata = null  // Fallback metadata from HTML

        const SCREENSHOT_API_KEY = process.env.SCREENSHOT_API_KEY
        if (!SCREENSHOT_API_KEY) {
            console.warn('Screenshot API key not configured, will try HTML fallback')
        }

        // Try screenshot first
        if (SCREENSHOT_API_KEY) {
            try {
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
                    console.log('Screenshot captured successfully')
                } else {
                    const errorText = await screenshotResponse.text()
                    console.error('ScreenshotOne API error:', errorText)
                }
            } catch (e) {
                console.error('Screenshot failed:', e.message)
            }
        }

        // Fallback: Try HTML extraction if screenshot failed
        if (!screenshotBase64) {
            console.log('Screenshot failed, trying HTML fallback...')
            try {
                const htmlResponse = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-Fetch-User': '?1',
                        'Cache-Control': 'max-age=0'
                    },
                    redirect: 'follow'
                })

                if (htmlResponse.ok) {
                    const html = await htmlResponse.text()
                    htmlMetadata = extractMetadataFromHtml(html, url)
                    console.log('HTML metadata extracted:', htmlMetadata.title)
                } else {
                    console.error('HTML fetch failed:', htmlResponse.status)
                }
            } catch (e) {
                console.error('HTML fallback failed:', e.message)
            }
        }

        // If both failed, return error
        if (!screenshotBase64 && !htmlMetadata) {
            return res.status(500).json({
                error: 'Failed to capture website',
                message: 'Both screenshot and HTML extraction failed'
            })
        }

        // Step 2: Call AI for brand analysis (all info extracted from screenshot)
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
    ],
    "antiCrawlDetected": false
}

Guidelines:
- For colors: You MUST extract EXACTLY 4 colors that are actually used on the website. Analyze the screenshot carefully and identify the 4 most frequently used colors (primary brand color, secondary colors, accent colors, background colors). Do NOT use placeholder colors like #888888 or #000000 unless they are genuinely used. Each color must be a real color visible on the website.
- For typography: Identify the primary font family used based on visual appearance.
- For baseAppearance: Choose the style that best matches the visual design.
- For visualAreas: Identify exactly 3 areas. Use yPercent (0-100) for vertical position and heightPercent for height.
- For antiCrawlDetected: Set to true ONLY if the screenshot shows an error page, access denied message, captcha, Cloudflare challenge, or any other anti-bot protection page instead of the actual website content.
- Return ONLY valid JSON, no additional text.`

        const messages = [
            { role: 'system', content: systemPrompt }
        ]

        if (screenshotBase64) {
            // Best case: We have a screenshot
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: `Analyze this full-page website screenshot and extract the brand kit plus identify 3 key visual areas: ${url}` },
                    { type: 'image_url', image_url: { url: screenshotBase64 } }
                ]
            })
        } else if (htmlMetadata) {
            // Fallback: Use HTML metadata for analysis
            const metadataContext = `
Website URL: ${url}
Title: ${htmlMetadata.title || 'N/A'}
Description: ${htmlMetadata.description || 'N/A'}
Theme Color: ${htmlMetadata.themeColor || 'N/A'}
Favicon: ${htmlMetadata.favicon || 'N/A'}
OG Image: ${htmlMetadata.ogImage || 'N/A'}

Note: Screenshot was not available. Please analyze based on the metadata above and your knowledge of this brand/website.
For visualAreas, provide placeholder values since no screenshot is available.
For colors, if theme-color is available use it as primary, otherwise make educated guesses based on the brand.`

            messages.push({
                role: 'user',
                content: metadataContext
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

        // Detect anti-crawl from AI analysis
        const isAntiCrawl = brandKit.antiCrawlDetected === true

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

            // Try to extract logo from HTML (non-blocking, doesn't affect main extraction)
            try {
                const htmlResponse = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9'
                    },
                    redirect: 'follow',
                    signal: AbortSignal.timeout(5000)  // 5 second timeout
                })

                if (htmlResponse.ok) {
                    const html = await htmlResponse.text()
                    const logoUrl = extractLogoFromHtml(html, url)
                    if (logoUrl) {
                        brandKit.brandIdentity.logo = logoUrl
                        console.log('Logo extracted from HTML:', logoUrl)
                    }
                }
            } catch (logoError) {
                // Logo extraction failure is non-fatal
                console.log('Logo extraction skipped:', logoError.message)
            }
        }

        // Remove internal fields from response
        delete brandKit.visualAreas
        delete brandKit.antiCrawlDetected

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

// Note: HTML metadata extraction removed - all brand info now comes from AI screenshot analysis

export default router
