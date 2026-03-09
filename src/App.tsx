import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { PlusCircle, Home, LogOut, Briefcase } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import NewClaim from './pages/NewClaim'
import ClaimDetails from './pages/ClaimDetails'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'

function Navigation({ session, role }: { session: any, role: string }) {
  const location = useLocation()
  
  const isActive = (path: string) => {
    return location.pathname === path ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-50 hover:text-primary-600"
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col shrink-0">
      <div className="flex items-center space-x-3 mb-10">
        <div className="h-10 w-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-bold">EM</div>
        <span className="font-bold text-slate-800 tracking-tight">ExpenseManager</span>
      </div>
      
      <div className="space-y-2 flex-1">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">Employee</div>
        <Link 
          to="/" 
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/')}`}
        >
          <Home size={20} className={location.pathname === '/' ? 'text-primary-600' : 'text-slate-400'} />
          <span>Dashboard</span>
        </Link>
        <Link 
          to="/new" 
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/new')}`}
        >
          <PlusCircle size={20} className={location.pathname === '/new' ? 'text-primary-600' : 'text-slate-400'} />
          <span>New Claim</span>
        </Link>
        
        {role === 'MANAGER' && (
          <>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2 pt-6">Management</div>
            <Link 
              to="/admin" 
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/admin')}`}
            >
              <Briefcase size={20} className={location.pathname === '/admin' ? 'text-primary-600' : 'text-slate-400'} />
              <span>Approvals</span>
            </Link>
          </>
        )}
      </div>

      <div className="pt-8 border-t border-slate-100 mt-auto">
        <div className="flex items-center justify-between group">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold shrink-0">
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-800 truncate" title={session.user.email}>
                {session.user.email}
              </p>
              <p className="text-xs text-slate-500">{role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  )
}

function Layout({ children, session, role }: { children: React.ReactNode, session: any, role: string }) {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row font-sans">
      <Navigation session={session} role={role} />
      
      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full relative">
        {children}
      </main>
    </div>
  )
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [role, setRole] = useState<string>('EMPLOYEE')
  const [isLoading, setIsLoading] = useState(true)

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()
      
      if (!error && data) {
        setRole(data.role)
      }
    } catch (error) {
      console.error('Error fetching role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchRole(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // 2. Listen for auth changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchRole(session.user.id)
      } else {
        setRole('EMPLOYEE')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary-100 rounded-xl mb-4"></div>
          <div className="text-slate-400 font-medium">Loading workspace...</div>
        </div>
      </div>
    )
  }

  // If no session, FORCE login screen
  if (!session) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Layout session={session} role={role}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewClaim />} />
          <Route path="/claim/:id" element={<ClaimDetails />} />
          {role === 'MANAGER' && (
            <Route path="/admin" element={<AdminDashboard />} />
          )}
          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
