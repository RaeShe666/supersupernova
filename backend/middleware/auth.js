import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('Supabase env vars not set in backend')
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '')

export const authenticateUser = async (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No token provided'
        })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token format'
        })
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            console.error('Auth error:', error)
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            })
        }

        // Attach user to request
        req.user = user
        next()
    } catch (err) {
        console.error('Auth middleware error:', err)
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Authentication failed'
        })
    }
}
