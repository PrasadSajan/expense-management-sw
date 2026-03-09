import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function NewClaim() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('Please enter a claim title')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('claims')
        .insert([
          { 
            title, 
            status: 'DRAFT', 
            total_amount: 0,
            user_id: user.id // Tie the claim to the specific user!
          }
        ])
        .select()
        .single()

      if (error) throw error
      
      navigate(`/claim/${data.id}`)
    } catch (err: any) {
      console.error('Error creating claim:', err)
      setError(err.message || 'Failed to create claim')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Create New Claim</h1>
          <p className="text-slate-500 text-sm">Start a new expense report to add items into</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleCreate} className="p-6 md:p-8 space-y-6">
          
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              Claim Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Delhi Client Visit - March 2026"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800"
              autoFocus
              required
            />
            <p className="mt-2 text-sm text-slate-500">
              Give this claim a descriptive name so you can easily identify it later.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-sm shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <span>Create Claim Container</span>
                  <Send size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
