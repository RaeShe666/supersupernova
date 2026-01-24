import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './LoginPage.css'

function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()

    const handleGoogleSignIn = async () => {
        setError('')
        try {
            await signInWithGoogle()
        } catch (err) {
            setError(err.message)
        }
    }

    const handleEmailSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setLoading(true)

        try {
            if (isSignUp) {
                await signUpWithEmail(email, password, displayName)
                setMessage('Check your email for the confirmation link!')
            } else {
                await signInWithEmail(email, password)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const switchMode = () => {
        setIsSignUp(!isSignUp)
        setError('')
        setMessage('')
    }

    return (
        <div className="login-page">
            {/* Left side - Image */}
            <div className="login-image-side">
                <div className="brand-logo">syl.ailabs</div>
                <img src="/login-bg5.jpg" alt="Background" className="login-bg-image" />
            </div>

            {/* Right side - Login Form */}
            <div className="login-form-side">
                <div className="login-container">
                    {/* Header */}
                    <div className="login-header">
                        <h1 className="login-title">
                            {isSignUp ? 'Sign up' : 'Sign in'}
                        </h1>
                        <p className="login-subtitle">
                            or{' '}
                            <button type="button" className="auth-link" onClick={switchMode}>
                                {isSignUp ? 'Sign in to your account' : 'create an account'}
                            </button>
                        </p>
                    </div>

                    {/* Google Login */}
                    <button type="button" className="google-btn" onClick={handleGoogleSignIn}>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="divider">
                        <span>OR</span>
                    </div>

                    {/* Email Form */}
                    <form className="login-form" onSubmit={handleEmailSubmit}>
                        <div className="form-group">
                            <input
                                type="email"
                                className="form-input"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {isSignUp && (
                                <span className="form-hint">At least 6 characters</span>
                            )}
                        </div>

                        {/* Display Name - only for Sign Up */}
                        {isSignUp && (
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Display Name (Optional)"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                            </div>
                        )}

                        {error && <div className="error-message">{error}</div>}
                        {message && <div className="success-message">{message}</div>}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading && <span className="btn-spinner" />}
                            Enter
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
