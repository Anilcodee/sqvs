import React, { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle, X, AlertTriangle, Globe, Mail, Phone } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const VerifierApproval = () => {
  const [verifiers, setVerifiers] = useState([])
  const [filter, setFilter] = useState('all') // all, Pending, Approved, Rejected, Suspended
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchVerifiers = async () => {
    try {
      setLoading(true)
      const url = filter === 'all' ? '/admin/verifiers' : `/admin/verifiers?status=${filter}`
      const { data } = await api.get(url)
      setVerifiers(data.verifiers || [])
    } catch (error) {
      toast.error('Failed to load verifiers')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVerifiers()
  }, [filter])

  const handleAction = async (vId, status) => {
    setActionLoading(true)
    try {
      await api.put(`/admin/verifiers/${vId}/approve`, { status })
      toast.success(`Verifier ${status.toLowerCase()} successfully`)
      fetchVerifiers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update verifier')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-700',
      Approved: 'bg-green-100 text-green-700',
      Rejected: 'bg-red-100 text-red-700',
      Suspended: 'bg-gray-100 text-gray-700'
    }
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status] || styles.Pending}`}>{status}</span>
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading && verifiers.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  return (
    <div>
      <div className='mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Verifier Management</h1>
          <p className='text-sm text-gray-500'>Approve and manage external organizations requesting verification access.</p>
        </div>
        
        <div className='flex items-center gap-2 overflow-x-auto pb-2 md:pb-0'>
          {['all', 'Pending', 'Approved', 'Rejected', 'Suspended'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition border cursor-pointer whitespace-nowrap ${filter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {verifiers.length === 0 ? (
        <div className='bg-white rounded-xl border border-gray-200 p-10 text-center'>
          <ShieldCheck size={40} className='text-indigo-500 mx-auto mb-3 opacity-20' />
          <p className='text-lg font-semibold text-gray-800'>No verifiers found</p>
          <p className='text-sm text-gray-500 mt-1'>No organizations match this filter at the moment.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4'>
          {verifiers.map(v => (
            <div key={v.Verifier_ID} className='bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow'>
              <div className='flex items-start justify-between'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100'>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className='text-base font-bold text-gray-800'>{v.Organization_Name}</h3>
                    <div className='flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium'>
                      <span className='flex items-center gap-1'><Globe size={12} /> {v.Country}</span>
                      <span className='w-1 h-1 bg-gray-300 rounded-full'></span>
                      <span>{v.Verifier_Type}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(v.Status)}
              </div>

              <div className='mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-50 pt-4'>
                <div className='flex items-center gap-2'>
                  <CheckCircle size={14} className='text-gray-400' />
                  <div className='min-w-0'>
                    <p className='text-[10px] text-gray-400 uppercase tracking-wider font-bold'>Contact Person</p>
                    <p className='text-xs font-semibold text-gray-700 truncate'>{v.Contact_Person}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Mail size={14} className='text-gray-400' />
                  <div className='min-w-0'>
                    <p className='text-[10px] text-gray-400 uppercase tracking-wider font-bold'>Email Address</p>
                    <p className='text-xs font-semibold text-gray-700 truncate'>{v.Email}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Phone size={14} className='text-gray-400' />
                  <div className='min-w-0'>
                    <p className='text-[10px] text-gray-400 uppercase tracking-wider font-bold'>Phone Number</p>
                    <p className='text-xs font-semibold text-gray-700 truncate'>{v.Phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {v.Status === 'Pending' && (
                <div className='mt-6 flex justify-end gap-3'>
                  <button 
                    onClick={() => handleAction(v.Verifier_ID, 'Rejected')} 
                    disabled={actionLoading}
                    className='px-5 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent cursor-pointer'>
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(v.Verifier_ID, 'Approved')} 
                    disabled={actionLoading}
                    className='px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition flex items-center gap-2 cursor-pointer'>
                    <CheckCircle size={16} /> Approve Access
                  </button>
                </div>
              )}

              {v.Status === 'Approved' && (
                <div className='mt-6 flex justify-end'>
                  <button 
                    onClick={() => handleAction(v.Verifier_ID, 'Suspended')} 
                    disabled={actionLoading}
                    className='px-5 py-2 text-sm font-bold text-yellow-600 hover:bg-yellow-50 rounded-lg transition border border-transparent cursor-pointer'>
                    Suspend Account
                  </button>
                </div>
              )}

              {v.Status === 'Suspended' && (
                <div className='mt-6 flex justify-end'>
                  <button 
                    onClick={() => handleAction(v.Verifier_ID, 'Approved')} 
                    disabled={actionLoading}
                    className='px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition cursor-pointer'>
                    Restore Access
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VerifierApproval
