// Test script: Check if ScreenshotOne can capture Notion pages
// Run with: node test-notion-screenshot.js

import fs from 'fs'
import path from 'path'

// You can change this to any Notion page URL you're trying to scrape
const TEST_URLS = [
    'https://www.notion.so',  // Notion homepage
    'https://notion.so/product',  // Notion product page
    // Add your specific Notion page URL here if you have one
]

// Load environment variables manually (check both locations)
const loadEnv = (envPath) => {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8')
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=')
            if (key && valueParts.length && !key.trim().startsWith('#')) {
                process.env[key.trim()] = valueParts.join('=').trim()
            }
        })
        return true
    }
    return false
}

// Try backend/.env first, then parent .env
loadEnv(path.join(process.cwd(), '.env'))
loadEnv(path.join(process.cwd(), '..', '.env'))

const SCREENSHOT_API_KEY = process.env.SCREENSHOT_API_KEY

if (!SCREENSHOT_API_KEY) {
    console.error('❌ SCREENSHOT_API_KEY not found in environment')
    console.log('Please set SCREENSHOT_API_KEY in backend/.env file')
    process.exit(1)
}

console.log('🔍 Testing ScreenshotOne API for Notion pages...\n')

async function testScreenshot(url) {
    console.log(`\n📸 Testing: ${url}`)
    console.log('─'.repeat(50))

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

        console.log('⏳ Requesting screenshot...')
        const response = await fetch(screenshotApiUrl)

        if (!response.ok) {
            const errorText = await response.text()
            console.log('❌ ScreenshotOne API Error:')
            console.log(`   Status: ${response.status}`)
            console.log(`   Error: ${errorText}`)
            return { success: false, error: errorText }
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Save screenshot to file for visual inspection
        const filename = `test-screenshot-${url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}.png`
        fs.writeFileSync(filename, buffer)

        console.log(`✅ Screenshot captured successfully!`)
        console.log(`   File size: ${(buffer.length / 1024).toFixed(2)} KB`)
        console.log(`   Saved to: ${filename}`)

        // Check image dimensions using simple PNG header parsing
        if (buffer.length > 24 && buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
            const width = buffer.readUInt32BE(16)
            const height = buffer.readUInt32BE(20)
            console.log(`   Dimensions: ${width}x${height}`)
        }

        return { success: true, size: buffer.length, filename }

    } catch (error) {
        console.log(`❌ Error: ${error.message}`)
        return { success: false, error: error.message }
    }
}

async function testDirectFetch(url) {
    console.log(`\n🌐 Testing direct fetch: ${url}`)
    console.log('─'.repeat(50))

    try {
        // Simple fetch (like your current code)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })

        const html = await response.text()

        // Check for anti-crawl indicators
        const antiCrawlKeywords = ['access denied', 'forbidden', '403', 'blocked', 'captcha', 'robot', 'cloudflare', 'cf-', 'challenge']
        const htmlLower = html.toLowerCase()

        const detectedKeywords = antiCrawlKeywords.filter(kw => htmlLower.includes(kw))

        console.log(`   Status: ${response.status}`)
        console.log(`   Content length: ${html.length} chars`)

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        const title = titleMatch ? titleMatch[1] : '(no title found)'
        console.log(`   Page title: ${title}`)

        if (detectedKeywords.length > 0) {
            console.log(`⚠️  Anti-crawl keywords detected: ${detectedKeywords.join(', ')}`)
            return { success: false, blocked: true, keywords: detectedKeywords }
        } else {
            console.log(`✅ No obvious anti-crawl detected`)
            return { success: true, title }
        }

    } catch (error) {
        console.log(`❌ Fetch error: ${error.message}`)
        return { success: false, error: error.message }
    }
}

// Run tests
async function main() {
    const results = []

    for (const url of TEST_URLS) {
        const screenshotResult = await testScreenshot(url)
        const fetchResult = await testDirectFetch(url)

        results.push({
            url,
            screenshot: screenshotResult,
            directFetch: fetchResult
        })
    }

    // Summary
    console.log('\n\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))

    for (const r of results) {
        console.log(`\n${r.url}:`)
        console.log(`   Screenshot: ${r.screenshot.success ? '✅ Success' : '❌ Failed'}`)
        console.log(`   Direct fetch: ${r.directFetch.success ? '✅ Success' : r.directFetch.blocked ? '⚠️ Blocked' : '❌ Failed'}`)
    }

    console.log('\n💡 Check the saved PNG files to visually verify if the screenshots show real content or an anti-bot page.')
}

main().catch(console.error)
