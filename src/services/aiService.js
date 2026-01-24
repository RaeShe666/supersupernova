// AI Service for Brand Kit Extraction
// Handles both development (direct API) and production (Render backend) modes

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://yinli.one/v1'
const API_MODEL = import.meta.env.VITE_API_MODEL || 'gemini-3-flash-preview-thinking'

// Backend API URL - points to Render in production
const BACKEND_API_URL = import.meta.env.VITE_API_URL || ''

// Check if we're in production (Vercel)
const isProduction = window.location.hostname !== 'localhost'

/**
 * Main extraction function
 */
export async function extractBrandKit(websiteUrl, token = null) {
    try {
        if (isProduction) {
            // Production: Use backend API (secure, with screenshot)
            return await extractViaBackend(websiteUrl, token)
        } else {
            // Development: Direct API call (for testing)
            return await extractDirectly(websiteUrl)
        }
    } catch (error) {
        console.error('Error extracting brand kit:', error)
        return getMockBrandKit(websiteUrl)
    }
}

/**
 * Extract via backend API (production)
 */
async function extractViaBackend(websiteUrl, token) {
    const headers = {}
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${BACKEND_API_URL}/api/extract?url=${encodeURIComponent(websiteUrl)}`, {
        headers
    })

    if (!response.ok) {
        throw new Error('Backend extraction failed')
    }

    const result = await response.json()

    if (!result.success) {
        throw new Error(result.error || 'Extraction failed')
    }

    return result.data
}

/**
 * Extract directly via AI API (development)
 */
async function extractDirectly(websiteUrl) {
    if (!OPENAI_API_KEY) {
        console.warn('API Key not configured. Using mock data.')
        return getMockBrandKit(websiteUrl)
    }

    const systemPrompt = `You are a brand analyst expert. Analyze the given website and extract the brand kit information.

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
        "tones": ["Professional", "Friendly", "Bold"],
        "images": []
    }
}

Guidelines:
- For colors: You MUST extract EXACTLY 4 colors that are actually used on the website. Identify the 4 most frequently used colors (primary brand color, secondary colors, accent colors, background colors). Do NOT use placeholder colors like #888888. Each color must be a real color from the website.
- For typography: Return the primary font family name.
- For baseAppearance: Choose the style that best matches their visual design.
- For keywords: Focus on audience, value proposition, features.
- For tones: List 2-4 brand tone descriptors.
- Keep the overview concise (1-2 sentences).
- Return ONLY valid JSON, no additional text.`

    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: API_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Analyze this website and extract the brand kit: ${websiteUrl}` }
            ],
            max_tokens: 4000,
            temperature: 0.3
        })
    })

    if (!response.ok) {
        throw new Error('AI API request failed')
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        throw new Error('No valid JSON in AI response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Keep first 4 colors (AI should return top 4 most used colors)
    if (parsed.visualSystem?.colors) {
        parsed.visualSystem.colors = parsed.visualSystem.colors.slice(0, 4)
    }

    // Ensure images array exists
    if (!parsed.brandContext.images) {
        parsed.brandContext.images = []
    }

    return parsed
}

/**
 * Mock brand kit for fallback
 */
function getMockBrandKit(websiteUrl) {
    const domain = new URL(websiteUrl).hostname.replace('www.', '')
    const name = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)

    return {
        brandIdentity: {
            name: name,
            tagline: 'Your tagline here',
            logo: null
        },
        visualSystem: {
            colors: ['#FF6B4A', '#4A7BF7', '#22C55E', '#9333EA'],
            typography: 'Inter',
            baseAppearance: 'clean-minimal'
        },
        brandContext: {
            overview: `${name} is a company focused on delivering value to its customers.`,
            keywords: ['Innovation', 'Quality', 'Service'],
            tones: ['Professional', 'Modern'],
            images: []
        }
    }
}

export default { extractBrandKit }
