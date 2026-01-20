// Screenshot API - Render version
// Uses ScreenshotOne for full-page screenshots

import { Router } from 'express'

const router = Router()

router.get('/screenshot', async (req, res) => {
    const url = req.query.url

    if (!url) {
        return res.status(400).json({ error: 'URL is required' })
    }

    const SCREENSHOT_API_KEY = process.env.SCREENSHOT_API_KEY

    if (!SCREENSHOT_API_KEY) {
        return res.status(500).json({ error: 'Screenshot API key not configured' })
    }

    try {
        // Build ScreenshotOne API URL
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

        // Fetch screenshot
        const screenshotResponse = await fetch(screenshotApiUrl)

        if (!screenshotResponse.ok) {
            const errorText = await screenshotResponse.text()
            console.error('ScreenshotOne API error:', errorText)
            throw new Error('Screenshot API failed')
        }

        // Convert to base64
        const arrayBuffer = await screenshotResponse.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const screenshotBase64 = `data:image/png;base64,${base64}`

        // Extract metadata from HTML
        let metadata = {}
        try {
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
            console.log('Metadata extraction failed:', e.message)
        }

        res.json({
            success: true,
            screenshot: screenshotBase64,
            screenshotSize: arrayBuffer.byteLength,
            metadata: metadata,
            method: 'screenshotone-fullpage'
        })

    } catch (error) {
        console.error('Screenshot error:', error)
        res.status(500).json({
            error: 'Failed to capture screenshot',
            message: error.message
        })
    }
})

// Extract metadata from HTML
function extractMetadataFromHtml(html, baseUrl) {
    const getMatch = (pattern) => {
        const match = pattern.exec(html)
        return match ? match[1] : null
    }

    return {
        title: getMatch(/<title[^>]*>([^<]+)<\/title>/i),
        description: getMatch(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
            getMatch(/<meta[^>]*content="([^"]+)"[^>]*name="description"/i),
        ogImage: resolveUrl(
            getMatch(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
            getMatch(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i),
            baseUrl
        ),
        ogTitle: getMatch(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i),
        favicon: resolveUrl(
            getMatch(/<link[^>]*rel="icon"[^>]*href="([^"]+)"/i) ||
            getMatch(/<link[^>]*rel="shortcut icon"[^>]*href="([^"]+)"/i),
            baseUrl
        ),
        appleTouchIcon: resolveUrl(
            getMatch(/<link[^>]*rel="apple-touch-icon"[^>]*href="([^"]+)"/i),
            baseUrl
        ),
        logoUrl: extractLogoFromHtml(html, baseUrl),
        h1: getMatch(/<h1[^>]*>([^<]+)<\/h1>/i)
    }
}

function extractLogoFromHtml(html, baseUrl) {
    const imgPatterns = [
        /<img[^>]*class="[^"]*logo[^"]*"[^>]*src="([^"]+)"/gi,
        /<img[^>]*src="([^"]*logo[^"]*)"/gi,
        /<img[^>]*alt="[^"]*logo[^"]*"[^>]*src="([^"]+)"/gi,
        /<img[^>]*src="([^"]+)"[^>]*class="[^"]*logo[^"]*"/gi
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
