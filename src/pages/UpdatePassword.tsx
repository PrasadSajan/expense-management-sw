import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, Key } from 'lucide-react'

export default function UpdatePassword({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      alert('Password updated successfully!')
      onComplete()
    } catch (err: any) {
      console.error('Update Password Error:', err)
      setError(err.message || 'An error occurred while updating the password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-primary-100 selection:text-primary-900 animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Key size={28} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Update Password</h2>
        <p className="text-slate-500 text-center text-sm font-medium mb-8">Please enter your new secure password.</p>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
           <div>
             <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-0.5">New Password</label>
             <input
               type="password"
               value={password}
               onChange={e => setPassword(e.target.value)}
               placeholder="••••••••"
               className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
               required
             />
           </div>
           
           <button 
             type="submit" 
             disabled={loading} 
             className="w-full flex justify-center items-center py-3.5 mt-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-sm shadow-primary-600/20 transition-all disabled:opacity-50"
           >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save New Password'}
           </button>
        </form>
      </div>
    </div>
  )
}
