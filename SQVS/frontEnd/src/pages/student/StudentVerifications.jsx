import React, { useState, useEffect } from 'react'
import { Building, CheckCircle, Clock, AlertTriangle, X, FileText, Download } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const StudentVerifications = () => {
  const [tab, setTab] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReq, setSelectedReq] = useState(null)
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchVerifications = async () => {
    try {
      const { data } = await api.get('/student/verifications')
      setVerifications(data.verifications || [])
    } catch (error) {
      toast.error('Failed to load verification requests')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVerifications()
  }, [])

  const handleConsent = async (requestId, qualId, consent) => {
    setActionLoading(true)
    try {
      await api.put(`/student/consent/${requestId}/${qualId}`, { consent })
      toast.success(`Consent ${consent.toLowerCase()} successfully`)
      await fetchVerifications()
      setModalOpen(false)
      setSelectedReq(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update consent')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownloadCertificate = async (certNumber) => {
    try {
      const response = await api.get(`/public/certificates/${certNumber}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `SQVS-Certificate-${certNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      toast.error('Failed to download certificate')
      console.error(error)
    }
  }

  const handleDownloadReceipt = async (requestId) => {
    try {
      const response = await api.get(`/student/payments/${requestId}/receipt`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `SQVS-Receipt-${requestId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      toast.error('Failed to download payment receipt')
      console.error(error)
    }
  }

  const handleReview = (req) => {
    setSelectedReq(req)
    setModalOpen(true)
  }

  const getStatusBadge = (status) => {
    if (status === 'Completed' || status === 'In_Progress') return <span className='px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full'>{status.replace('_', ' ')}</span>
    return <span className='px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full'>{status}</span>
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const filteredVerifications = verifications.filter(v => {
    if (tab === 'active') return v.Status === 'Pending' || v.Status === 'In_Progress'
    if (tab === 'completed') return v.Status === 'Completed'
    return true
  })

  const counts = {
    active: verifications.filter(v => v.Status === 'Pending' || v.Status === 'In_Progress').length,
    completed: verifications.filter(v => v.Status === 'Completed').length,
    all: verifications.length,
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-800 mb-6'>Verification Requests</h1>

      {/* Tabs */}
      <div className='flex gap-4 border-b border-gray-200 mb-6'>
        {['active', 'completed', 'all'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`pb-2 text-sm font-semibold capitalize transition cursor-pointer ${tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      {filteredVerifications.length === 0 ? (
        <div className='text-center py-10 text-gray-400 text-sm'>No verification requests found.</div>
      ) : (
        <div className='space-y-4'>
          {filteredVerifications.map(req => {
            const hasPendingConsent = req.qualifications?.some(q => q.Consent_Status === 'Pending')
            return (
              <div key={req.Request_ID} className={`bg-white rounded-xl border ${hasPendingConsent ? 'border-yellow-400' : 'border-gray-200'} p-5`}>
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center'>
                      <Building size={20} />
                    </div>
                    <div>
                      <p className='text-sm font-semibold text-gray-800'>{req.Organization_Name}</p>
                      <p className='text-xs text-gray-500'>Type: {req.Verifier_Type}</p>
                    </div>
                  </div>
                  {getStatusBadge(req.Status)}
                </div>

                <div className='grid grid-cols-2 gap-3 text-sm mb-4'>
                  <p className='text-gray-500'>Purpose: <span className='font-medium text-gray-800'>{req.Purpose}</span></p>
                  <p className='text-gray-500'>Payment: <span className='font-medium text-gray-800'>₹{req.Amount} ({req.Payment_Status})</span></p>
                  <p className='text-gray-500'>Requested: {formatDate(req.Request_Date)}</p>
                  <p className='text-gray-500'>Expires: {formatDate(req.Expiry_Date)}</p>
                </div>

                {/* Qualifications */}
                <div className='bg-gray-50 rounded-lg p-3 mb-4'>
                  <p className='text-xs font-semibold text-gray-600 mb-2'>Qualifications Requested:</p>
                  {(req.qualifications || []).map((q, i) => (
                    <div key={i} className='flex items-center justify-between text-sm'>
                      <span className='flex items-center gap-1.5'>
                        {q.Consent_Status === 'Granted' ? <CheckCircle size={14} className='text-green-500' /> : q.Consent_Status === 'Denied' ? <AlertTriangle size={14} className='text-red-500' /> : <Clock size={14} className='text-yellow-500' />}
                        {q.Degree_Name} ({q.Completion_Date ? new Date(q.Completion_Date).getFullYear() : ''})
                      </span>
                      <span className={`text-xs font-semibold ${q.Consent_Status === 'Granted' ? 'text-green-600' : q.Consent_Status === 'Denied' ? 'text-red-600' : 'text-yellow-600'}`}>Consent: {q.Consent_Status}</span>
                    </div>
                  ))}
                </div>

                <div className='flex items-center justify-between'>
                  {hasPendingConsent && (
                    <p className='text-xs text-yellow-700 font-semibold flex items-center gap-1'>
                      <AlertTriangle size={14} /> Consent Required for {req.qualifications.filter(q => q.Consent_Status === 'Pending').length} qualification(s)
                    </p>
                  )}
                  <div className='flex gap-2 ml-auto'>
                    {hasPendingConsent ? (
                      <button onClick={() => handleReview(req)} className='px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-lg hover:bg-yellow-600 transition cursor-pointer'>
                        Review & Grant Consent
                      </button>
                    ) : (
                      <div className='flex flex-wrap items-center justify-end gap-2'>
                        {req.Payment_Status === 'Completed' && (
                          <button onClick={() => handleDownloadReceipt(req.Request_ID)} className='px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-semibold rounded-lg transition flex items-center gap-2 cursor-pointer border border-gray-200'>
                            <FileText size={16} /> Receipt
                          </button>
                        )}
                        {req.Status === 'Completed' && req.Certificate_Number && (
                          <button onClick={() => handleDownloadCertificate(req.Certificate_Number)} className='px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-2 cursor-pointer'>
                            <Download size={16} /> Certificate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Consent Modal */}
      {modalOpen && selectedReq && (
        <div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4'>
          <div className='bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between px-5 py-4 border-b border-gray-200'>
              <h2 className='text-lg font-bold text-gray-800'>Review Verification Request</h2>
              <button onClick={() => setModalOpen(false)} className='text-gray-400 hover:text-gray-600 cursor-pointer'><X size={22} /></button>
            </div>
            <div className='p-5 space-y-5'>
              <p className='text-sm text-gray-700'>
                <strong>{selectedReq.Organization_Name}</strong> has requested to verify the following qualifications.
              </p>
              {(selectedReq.qualifications || []).filter(q => q.Consent_Status === 'Pending').map((q, i) => (
                <div key={i} className='bg-gray-50 rounded-lg p-3'>
                  <p className='text-sm font-semibold'>☑️ {q.Degree_Name} ({q.Completion_Date ? new Date(q.Completion_Date).getFullYear() : ''})</p>
                  <p className='text-xs text-gray-500 mt-1'>Data shared: Degree name, Institution, Marks, Dates</p>
                  <div className='flex gap-2 mt-3'>
                    <button
                      onClick={() => handleConsent(selectedReq.Request_ID, q.Qualification_ID || q.qualId, 'Granted')}
                      disabled={actionLoading}
                      className='px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer'
                    >
                      {actionLoading ? 'Processing...' : 'Grant Consent'}
                    </button>
                    <button
                      onClick={() => handleConsent(selectedReq.Request_ID, q.Qualification_ID || q.qualId, 'Denied')}
                      disabled={actionLoading}
                      className='px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer'
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800'>
                <strong>Important:</strong> Once granted, the verifier will be able to access your qualification data.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentVerifications
