import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Camera, Receipt, FileText, Loader2, Send, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ExpenseItem {
  id: string
  expense_date: string
  category: string
  amount: number
  description: string
  receipt_url: string
}

interface Claim {
  id: string
  title: string
  status: string
  total_amount: number
  user_id: string
}

export default function ClaimDetails() {
  const { id } = useParams<{ id: string }>()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [items, setItems] = useState<ExpenseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('EMPLOYEE')

  // Form states for new item
  const [isAdding, setIsAdding] = useState(false)
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('Travel')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [savingItem, setSavingItem] = useState(false)
  
  // Upload & Submit state
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchClaimDetails()
    }
  }, [id])

  async function fetchClaimDetails() {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
        if (roleData) setUserRole(roleData.role)
      }

      const { data: claimData, error: claimError } = await supabase
        .from('claims')
        .select('*')
        .eq('id', id)
        .single()

      if (claimError) throw claimError
      setClaim(claimData)

      const { data: itemsData, error: itemsError } = await supabase
        .from('expense_items')
        .select('*')
        .eq('claim_id', id)
        .order('expense_date', { ascending: false })

      if (itemsError) throw itemsError
      setItems(itemsData || [])
    } catch (error) {
      console.error('Error fetching details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !amount || !date || !category) return

    try {
      setSavingItem(true)
      const newItem = {
        claim_id: id,
        expense_date: date,
        category,
        amount: parseFloat(amount),
        description,
        receipt_url: null, 
      }

      const { data, error } = await supabase
        .from('expense_items')
        .insert([newItem])
        .select()
        .single()

      if (error) throw error

      setItems([data, ...items])
      
      const newTotal = (claim?.total_amount || 0) + parseFloat(amount)
      await supabase
        .from('claims')
        .update({ total_amount: newTotal })
        .eq('id', id)
        
      setClaim(claim ? { ...claim, total_amount: newTotal } : null)

      setIsAdding(false)
      setAmount('')
      setDescription('')
      setDate('')
      
    } catch (error) {
      console.error('Error adding item:', error)
      alert("Failed to add expense item")
    } finally {
      setSavingItem(false)
    }
  }

  const deleteItem = async (itemId: string, itemAmount: number) => {
    if (!id || !confirm("Are you sure you want to delete this expense?")) return
    
    try {
      const { error } = await supabase
        .from('expense_items')
        .delete()
        .eq('id', itemId)
        
      if (error) throw error
      
      setItems(items.filter(i => i.id !== itemId))
      
      const newTotal = (claim?.total_amount || 0) - itemAmount
      await supabase
        .from('claims')
        .update({ total_amount: newTotal })
        .eq('id', id)
        
      setClaim(claim ? { ...claim, total_amount: newTotal } : null)
    } catch (error) {
       console.error('Error deleting:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // VALIDATION: File size limit (5MB = 5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Please upload a receipt smaller than 5MB.")
      if (e.target) e.target.value = ''
      return
    }

    try {
      setUploadingItemId(itemId)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('expense_items')
        .update({ receipt_url: publicUrl })
        .eq('id', itemId)

      if (updateError) throw updateError

      setItems(items.map(item => 
        item.id === itemId ? { ...item, receipt_url: publicUrl } : item
      ))

    } catch (error) {
      console.error('Error uploading file:', error)
      alert("Failed to upload the receipt. Make sure the 'receipts' storage bucket exists and is public.")
    } finally {
      setUploadingItemId(null)
      if (e.target) e.target.value = '' 
    }
  }

  const handleSubmitClaim = async () => {
    if (!id || items.length === 0) return
    
    // VALIDATION: Ensure all expense items have a receipt uploaded
    const missingReceipts = items.filter(item => !item.receipt_url)
    if (missingReceipts.length > 0) {
      alert(`Cannot submit claim! You have ${missingReceipts.length} expense(s) missing a receipt. Please upload them first.`)
      return
    }
    
    if (!confirm("Are you sure you want to submit this claim? You will no longer be able to edit or add expenses to it.")) return

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from('claims')
        .update({ 
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      setClaim(claim ? { ...claim, status: 'SUBMITTED' } : null)
      setIsAdding(false) // Close the form if open
    } catch (error) {
      console.error('Error submitting claim:', error)
      alert("Failed to submit claim.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (newStatus: 'APPROVED' | 'REJECTED') => {
    if (!id || !claim) return
    
    if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this claim?`)) return
    
    try {
      setSubmitting(true)
      const { error } = await supabase
        .from('claims')
        .update({ status: newStatus })
        .eq('id', id)
        
      if (error) throw error
      
      setClaim({ ...claim, status: newStatus })
    } catch (error) {
      console.error(`Error updating claim status to ${newStatus}:`, error)
      alert("Failed to update claim status.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Loading claim details...</div>
  if (!claim) return <div className="p-10 text-center text-red-500">Claim not found.</div>

  const CATEGORIES = ['Travel', 'Meal', 'Hotel', 'Cab', 'Office Supplies', 'Other']
  const isOwner = currentUser?.id === claim.user_id
  const isManager = userRole === 'MANAGER'
  const isDraft = claim.status === 'DRAFT' && isOwner

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <button onClick={() => window.history.back()} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors hidden md:block">
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                claim.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                claim.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                claim.status === 'SUBMITTED' ? 'bg-orange-100 text-orange-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {claim.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{claim.title}</h1>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
          <div className="text-right">
            <p className="text-sm text-slate-500 font-medium">Total Claim Amount</p>
            <p className="text-3xl font-bold text-slate-800">
              ₹{Number(claim.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          {/* Submit Button */}
          {isDraft && items.length > 0 && (
            <button 
              onClick={handleSubmitClaim}
              disabled={submitting}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-green-600/20 disabled:opacity-50"
            >
              {submitting ? (
                <> <Loader2 size={16} className="animate-spin" /> <span>Submitting...</span> </>
              ) : (
                <> <Send size={16} /> <span>Submit for Approval</span> </>
              )}
            </button>
          )}

          {/* Manager Action Buttons */}
          {claim.status === 'SUBMITTED' && isManager && (
            <div className="flex items-center space-x-3 mt-2">
              <button 
                onClick={() => handleUpdateStatus('REJECTED')}
                disabled={submitting}
                className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                <span>Reject</span>
              </button>
              <button 
                onClick={() => handleUpdateStatus('APPROVED')}
                disabled={submitting}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-green-600/20 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                <span>Approve Claim</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Expense Items</h2>
        
        {isDraft && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            {isAdding ? "Cancel" : <><Plus size={16} /><span>Add Expense</span></>}
          </button>
        )}
      </div>

      {/* Add New Item Form container */}
      {isAdding && isDraft && (
        <div className="bg-primary-50 border border-primary-100 p-6 rounded-2xl animate-in slide-in-from-top-4 fade-in duration-300">
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 ml-1 uppercase tracking-wide">Date</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 ml-1 uppercase tracking-wide">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 ml-1 uppercase tracking-wide">Amount (₹)</label>
                <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 ml-1 uppercase tracking-wide">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="E.g., Dinner with client"
                  className="w-full px-3 py-2 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
               <button type="submit" disabled={savingItem} className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2 rounded-xl text-sm transition-colors">
                 {savingItem ? 'Saving...' : 'Save Expense'}
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {items.length === 0 ? (
           <div className="p-12 text-center flex flex-col items-center text-slate-500">
              <Receipt size={32} className="text-slate-300 mb-4" />
              <p>No expenses added yet.</p>
           </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex h-12 w-12 bg-slate-100 rounded-xl items-center justify-center text-slate-500">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{item.category}</h4>
                    <p className="text-sm text-slate-500">{item.description || "No description"} • {item.expense_date}</p>
                    
                    {item.receipt_url && (
                      <a 
                        href={item.receipt_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-medium text-primary-600 hover:text-primary-800 mt-1 bg-primary-50 px-2 py-1 rounded-md"
                      >
                        <FileText size={12} />
                        <span>View Receipt</span>
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end space-x-6 w-full sm:w-auto">
                  <span className="font-bold text-slate-800 text-lg">
                    ₹{Number(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                  
                  {isDraft && (
                    <div className="flex items-center space-x-2">
                      <input 
                        type="file" 
                        id={`file-${item.id}`} 
                        className="hidden" 
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, item.id)}
                      />
                      
                      <label 
                        htmlFor={`file-${item.id}`}
                        className={`p-2 rounded-lg transition-colors border cursor-pointer flex items-center justify-center
                          ${uploadingItemId === item.id 
                            ? 'bg-slate-100 text-slate-400 border-slate-200' 
                            : item.receipt_url
                              ? 'text-green-600 hover:bg-green-50 border-green-200 bg-green-50/50'
                              : 'text-primary-600 hover:bg-primary-50 border-primary-200'
                          }`}
                        title={item.receipt_url ? "Update Receipt" : "Upload Receipt"}
                      >
                        {uploadingItemId === item.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Camera size={16} />
                        )}
                      </label>
                      
                      <button 
                        onClick={() => deleteItem(item.id, Number(item.amount))} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100" 
                        title="Delete Expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  )
}
