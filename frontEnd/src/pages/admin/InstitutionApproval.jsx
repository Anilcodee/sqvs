import React, { useState, useEffect } from 'react'
import { Building, CheckCircle, X, AlertTriangle, FileText, Download } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const InstitutionApproval = () => {
  const [institutions, setInstitutions] = useState([])
  const [filter, setFilter] = useState('all') // all, Pending, Approved, Rejected, Suspended
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchInstitutions = async () => {
    try {
      setLoading(true)
      const url = filter === 'all' ? '/admin/institutions' : `/admin/institutions?status=${filter}`
      const { data } = await api.get(url)
      setInstitutions(data.institutions || [])
    } catch (error) {
      toast.error('Failed to load institutions')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstitutions()
  }, [filter])

  const handleAction = async (instId, status) => {
    setActionLoading(true)
    try {
      await api.put(`/admin/institutions/${instId}/approve`, { status })
      toast.success(`Institution ${status.toLowerCase()} successfully`)
      setModal(null)
      fetchInstitutions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update institution')
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

  if (loading && institutions.length === 0) {
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
          <h1 className='text-2xl font-bold text-gray-800'>Institutions Management</h1>
          <p className='text-sm text-gray-500'>Review and manage all academic institutions on the SQVS platform.</p>
        </div>
        
        <div className='flex items-center gap-2 overflow-x-auto pb-2 md:pb-0'>
          {['all', 'Pending', 'Approved', 'Rejected', 'Suspended'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition border cursor-pointer whitespace-nowrap ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {institutions.length === 0 ? (
        <div className='bg-white rounded-xl border border-gray-200 p-10 text-center'>
          <CheckCircle size={40} className='text-green-500 mx-auto mb-3' />
          <p className='text-lg font-semibold text-gray-800'>No results</p>
          <p className='text-sm text-gray-500 mt-1'>No institutions found matching this filter.</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {institutions.map(inst => (
            <div key={inst.Institution_ID} className='bg-white rounded-xl border border-gray-200 p-5'>
              <div className='flex items-start justify-between'>
                <div className='flex items-start gap-3'>
                  <div className='w-10 h-10 bg-gray-100 text-blue-600 rounded-lg flex items-center justify-center border border-gray-200'>
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 className='text-sm font-bold text-gray-800'>{inst.Institution_Name}</h3>
                    <p className='text-xs text-gray-500'>{inst.Institution_Type} • {inst.Location}</p>
                    <p className='text-xs text-gray-400 mt-1'>Applied: {formatDate(inst.Created_At)}</p>
                  </div>
                </div>
                {getStatusBadge(inst.Status)}
              </div>
              <div className='mt-4 bg-gray-50 rounded-lg p-3 text-sm'>
                <div className='grid grid-cols-2 gap-2'>
                  <p className='text-xs text-gray-500'>License: <span className='font-medium text-gray-800'>{inst.License_Number}</span></p>
                  <p className='text-xs text-gray-500'>Email: <span className='font-medium text-gray-800'>{inst.Contact_Email}</span></p>
                  <p className='text-xs text-gray-500'>Phone: <span className='font-medium text-gray-800'>{inst.Contact_Phone}</span></p>
                </div>
              </div>
              
              {inst.Status === 'Pending' && (
                <div className='mt-4 flex justify-end gap-2 text-sm'>
                  <button onClick={() => handleAction(inst.Institution_ID, 'Rejected')} disabled={actionLoading}
                    className='px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition disabled:opacity-50 cursor-pointer'>
                    Reject
                  </button>
                  <button onClick={() => handleAction(inst.Institution_ID, 'Approved')} disabled={actionLoading}
                    className='px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1 cursor-pointer'>
                    <CheckCircle size={16} /> Approve
                  </button>
                </div>
              )}
              
              {inst.Status === 'Approved' && (
                <div className='mt-4 flex justify-end gap-2 text-sm'>
                   <button onClick={() => handleAction(inst.Institution_ID, 'Suspended')} disabled={actionLoading}
                    className='px-4 py-2 border border-yellow-500 text-yellow-600 font-medium rounded-lg hover:bg-yellow-50 transition disabled:opacity-50 cursor-pointer'>
                    Suspend
                  </button>
                </div>
              )}

              {inst.Status === 'Suspended' && (
                <div className='mt-4 flex justify-end gap-2 text-sm'>
                   <button onClick={() => handleAction(inst.Institution_ID, 'Approved')} disabled={actionLoading}
                    className='px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer'>
                    Re-activate
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

export default InstitutionApproval
