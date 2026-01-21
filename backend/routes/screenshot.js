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

        res.json({
            success: true,
            screenshot: screenshotBase64,
            screenshotSize: arrayBuffer.byteLength,
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

export default router

