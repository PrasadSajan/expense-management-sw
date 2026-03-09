import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ChevronRight, CheckCircle, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Claim {
  id: string
  title: string
  status: string
  total_amount: number
  created_at: string
  user_id: string
}

export default function AdminDashboard() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPendingClaims()
  }, [])

  async function fetchPendingClaims() {
    try {
      setLoading(true)
      // For the Manager, we fetch ALL claims that are SUBMITTED
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .eq('status', 'SUBMITTED')
        .order('submitted_at', { ascending: false })

      if (error) throw error
      if (data) setClaims(data)
    } catch (error) {
      console.error('Error fetching pending claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClaims = claims.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manager Dashboard</h1>
          <p className="text-slate-500 text-sm">Review and process employee expense claims</p>
        </div>
        
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search claims..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="bg-orange-50 text-orange-600 p-3 rounded-xl"><FileText size={24} /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Pending Review</p>
            <p className="text-2xl font-bold text-slate-800">{loading ? '...' : claims.length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Claims Awaiting Approval</h2>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading pending claims...</div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h3 className="text-slate-700 font-medium mb-1">All caught up!</h3>
            <p className="text-slate-500 text-sm mb-4">There are no expense claims waiting for your approval right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredClaims.map((claim) => (
              <Link 
                key={claim.id} 
                to={`/claim/${claim.id}`}
                className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group"
              >
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">{claim.title}</h3>
                  <div className="flex items-center space-x-3 text-sm text-slate-500">
                    <span>Submitted: {new Date(claim.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      NEEDS REVIEW
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-slate-800 text-lg">
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
