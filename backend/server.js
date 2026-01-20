// Brand Kit Backend - Express Server
// Designed for Render deployment

import express from 'express'
import cors from 'cors'
import extractRouter from './routes/extract.js'
import screenshotRouter from './routes/screenshot.js'

const app = express()
const PORT = process.env.PORT || 8080

// CORS configuration - allow frontend domains
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true)

        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true)
        }
        callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}))

app.use(express.json())

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Brand Kit API',
        version: '1.0.0'
    })
})

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' })
})

// API routes
app.use('/api', extractRouter)
app.use('/api', screenshotRouter)

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err)
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    })
})

app.listen(PORT, () => {
    console.log(`🚀 Brand Kit API running on port ${PORT}`)
})
