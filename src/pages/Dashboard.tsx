import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Receipt, FileText, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Claim {
  id: string
  title: string
  status: string
  total_amount: number
  created_at: string
}

export default function Dashboard() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClaims()
  }, [])

  async function fetchClaims() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .eq('user_id', user.id) // ONLY fetch this specific user's claims
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setClaims(data)
    } catch (error) {
      console.error('Error fetching claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const drafts = claims.filter(c => c.status === 'DRAFT').length
  const pending = claims.filter(c => c.status === 'SUBMITTED').length
  const approved = claims.filter(c => c.status === 'APPROVED')
    .reduce((sum, c) => sum + Number(c.total_amount), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">My Claims</h1>
        <Link 
          to="/new" 
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <PlusCircle size={18} />
          <span>New Claim</span>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><FileText size={24} /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Drafts</p>
            <p className="text-2xl font-bold text-slate-800">{loading ? '...' : drafts}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="bg-orange-50 text-orange-600 p-3 rounded-xl"><Receipt size={24} /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Pending Approval</p>
            <p className="text-2xl font-bold text-slate-800">{loading ? '...' : pending}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="bg-green-50 text-green-600 p-3 rounded-xl"><Receipt size={24} /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Approved</p>
            <p className="text-2xl font-bold text-slate-800">
              {loading ? '...' : `₹${approved.toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Recent Claims</h2>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading claims...</div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <FileText size={32} className="text-slate-400" />
            </div>
            <h3 className="text-slate-700 font-medium mb-1">No claims yet</h3>
            <p className="text-slate-500 text-sm mb-4">Create your first expense claim to get started.</p>
            <Link 
              to="/new" 
              className="text-primary-600 font-medium text-sm hover:underline"
            >
              Start new claim →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {claims.map((claim) => (
              <Link 
                key={claim.id} 
                to={`/claim/${claim.id}`}
                className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group"
              >
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">{claim.title}</h3>
                  <div className="flex items-center space-x-3 text-sm text-slate-500">
                    <span>{new Date(claim.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      claim.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      claim.status === 'SUBMITTED' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-slate-800">
                    ₹{Number(claim.total_amount).toLocaleString()}
                  </span>
                  <ChevronRight size={20} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
