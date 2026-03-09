import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogIn, Loader2, Sparkles } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('Check your email to confirm your account (or just try logging in if emails are disabled locally).')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // The App component will detect the session change and redirect
      }
    } catch (err: any) {
      console.error('Authentication Error:', err)
      setError(err.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-primary-100 selection:text-primary-900">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-white border border-slate-200 shadow-sm rounded-2xl flex items-center justify-center mb-6 relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary-600/10 group-hover:scale-110 transition-transform duration-500 rounded-2xl"></div>
            <Sparkles className="text-primary-600 relative z-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expense Manager</h1>
          <p className="text-slate-500 mt-2 font-medium">Simplify your corporate travel logistics</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden backdrop-blur-sm">
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {isSignUp ? 'Create a corporate account' : 'Welcome back'}
            </h2>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-0.5">
                  Official Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 ml-0.5 pr-0.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  {!isSignUp && (
                    <a href="#" className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                      Forgot?
                    </a>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 shadow-sm shadow-primary-600/20 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    {!isSignUp && <LogIn className="ml-2 h-4 w-4" />}
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center text-sm">
            <span className="text-slate-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
              }}
              className="ml-2 font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-8 font-medium">
          Protected by Enterprise Grade Security
        </p>
      </div>
    </div>
  )
}
