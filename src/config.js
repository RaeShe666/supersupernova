/**
 * Configuration for AI Brand Kit Extractor
 * Uses third-party API provider (yinli.one) for AI analysis
 */

// API Key - loaded from environment variable
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''

// Screenshot API configuration (optional - for capturing website screenshots)
export const SCREENSHOT_API_KEY = import.meta.env.VITE_SCREENSHOT_API_KEY || ''
export const SCREENSHOT_API_URL = 'https://shot.screenshotapi.net/screenshot'

// API Configuration - using third-party provider
export const API_CONFIG = {
    openai: {
        baseUrl: 'https://yinli.one/v1',  // Third-party API endpoint
        model: 'gemini-3-flash-preview-thinking',  // Gemini model
        maxTokens: 4000
    }
}
