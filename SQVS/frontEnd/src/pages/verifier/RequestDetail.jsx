import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Download, FileText, Clock, AlertTriangle, UserCheck, Shield } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const RequestDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [requestDetails, setRequestDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const { data } = await api.get(`/verifier/requests/${id}`)
        setRequestDetails(data)
      } catch (error) {
        const msg = error.response?.data?.message || 'Failed to load request details'
        toast.error(msg)
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])


  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getStatusBadge = (status) => {
    if (status === 'Completed') return <span className='px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full flex items-center gap-1'><CheckCircle size={12} /> Verification Completed</span>
    if (status === 'Pending') return <span className='px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full flex items-center gap-1'><Clock size={12} /> Pending</span>
    if (status === 'Rejected') return <span className='px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full flex items-center gap-1'><AlertTriangle size={12} /> Request Rejected</span>
    return <span className='px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full flex items-center gap-1'><Clock size={12} /> In Progress</span>
  }

  const handleDownloadDocument = async (fileName) => {
    try {
      const response = await api.get(`/verifier/documents/${fileName}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      toast.error('Failed to download document')
      console.error(error)
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
      const response = await api.get(`/verifier/payments/${requestId}/receipt`, { responseType: 'blob' })
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

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  if (!requestDetails) {
    return (
      <div className='text-center py-20'>
        <p className='text-gray-500'>Request not found.</p>
        <button onClick={() => navigate('/verifier/dashboard')} className='text-blue-600 font-semibold mt-2 hover:underline cursor-pointer'>Go back to dashboard</button>
      </div>
    )
  }

  const { request, qualifications } = requestDetails

  return (
    <div>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 text-sm text-gray-500 mb-6'>
        <Link to="/verifier/dashboard" className='hover:text-blue-600 transition'>Dashboard</Link>
        <span>/</span>
        <span className='text-gray-800 font-medium'>REQ-{request.Request_ID}</span>
      </div>

      <div className='flex items-center justify-between mb-4'>
        <button onClick={() => navigate(-1)} className='flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition cursor-pointer'>
          <ArrowLeft size={16} /> Back
        </button>
        {request.Status === 'Completed' && request.Certificate_Number && (
          <button onClick={() => handleDownloadCertificate(request.Certificate_Number)} className='px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-2 cursor-pointer'>
            <Shield size={16} /> Download Verification Certificate
          </button>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          {/* Main Request Info */}
          <div className='bg-white rounded-xl border border-gray-200 p-6'>
            <div className='flex items-start justify-between mb-4'>
              <div>
                <h1 className='text-xl font-bold text-gray-800'>Request REQ-{request.Request_ID}</h1>
                <p className='text-sm text-gray-500 mt-1'>Purpose: {request.Purpose}</p>
              </div>
              {getStatusBadge(request.Status)}
            </div>

            {request.Status === 'Rejected' && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2'>
                <AlertTriangle size={16} />
                <span>Request Rejected – Student denied consent for one or more qualifications.</span>
              </div>
            )}
            {request.Status === 'Pending' && qualifications.some(q => q.Consent_Status === 'Pending') && (
              <div className='mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2'>
                <Clock size={16} />
                <span>Waiting for student consent.</span>
              </div>
            )}
            {request.Status === 'In_Progress' && request.Payment_Status === 'Pending' && qualifications.every(q => q.Consent_Status === 'Granted') && (
              <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2'>
                <Shield size={16} />
                <span>Consent Granted. Payment Required to complete verification.</span>
              </div>
            )}
            {request.Status === 'Pending' && request.Payment_Status === 'Pending' && qualifications.some(q => q.Consent_Status === 'Pending') && (
              <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2'>
                <Clock size={16} />
                <span>You can pay now to start the verification process. We will wait for student consent.</span>
              </div>
            )}

            <div className='grid grid-cols-2 gap-4 mt-4'>
              <div>
                <p className='text-xs text-gray-500'>Student</p>
                <p className='text-sm font-semibold text-gray-800 flex items-center gap-1'>
                  <UserCheck size={14} className="text-blue-600" /> {request.Student_Name}
                </p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Email</p>
                <p className='text-sm font-semibold text-gray-800'>{request.Student_Email}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Request Date</p>
                <p className='text-sm font-semibold text-gray-800'>{formatDate(request.Request_Date)}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Expiry Date</p>
                <p className='text-sm font-semibold text-gray-800'>{formatDate(request.Expiry_Date)}</p>
              </div>
            </div>
          </div>

          {/* Requested Qualifications */}
          <div className='space-y-4'>
            <h2 className='text-lg font-bold text-gray-800 border-b pb-2'>Requested Qualifications</h2>
            {qualifications.map((qual, idx) => (
              <div key={idx} className='bg-white rounded-xl border border-gray-200'>
                <div className='p-5 border-b border-gray-100 flex items-start justify-between bg-gray-50/50 rounded-t-xl'>
                  <div>
                    <h3 className='font-bold text-gray-800 text-lg'>{qual.Degree_Name}</h3>
                    <p className='text-sm text-gray-500'>{qual.Institution_Name}</p>
                  </div>
                  <div className='text-right'>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${qual.Consent_Status === "Granted" ? "bg-green-100 text-green-700" : qual.Consent_Status === "Denied" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      Consent: {qual.Consent_Status}
                    </span>
                    <p className='text-xs text-gray-400 mt-1'>ID: {qual.Certificate_Number}</p>
                  </div>
                </div>

                <div className='p-5'>
                  <div className='grid grid-cols-2 gap-y-3 mb-5'>
                    <div><p className='text-xs text-gray-400'>Level</p><p className='text-sm font-medium'>{qual.Qualification_Level}</p></div>
                    <div><p className='text-xs text-gray-400'>Field</p><p className='text-sm font-medium'>{qual.Field_of_Study}</p></div>
                    <div><p className='text-xs text-gray-400'>Duration</p><p className='text-sm font-medium'>{formatDate(qual.Enrollment_Date)} - {formatDate(qual.Completion_Date)}</p></div>
                    <div><p className='text-xs text-gray-400'>Grade</p><p className='text-sm font-medium'>{qual.Grade || `${qual.Percentage}%`}</p></div>
                  </div>

                  {/* Documents for this qualification */}
                  <div>
                    <h4 className='text-sm font-semibold text-gray-800 mb-2'>Supporting Documents</h4>
                    {qual.Consent_Status !== 'Granted' ? (
                      <div className='bg-amber-50 text-amber-700 p-3 rounded-lg text-sm border border-amber-200'>
                        <AlertTriangle size={16} className='inline mr-1' /> Documents are hidden until the student grants consent.
                      </div>
                    ) : qual.documents?.length === 0 ? (
                      <p className='text-sm text-gray-500 italic'>No documents provided.</p>
                    ) : (
                      <div className='space-y-2'>
                        {qual.documents?.map((doc, docIdx) => (
                          <div key={docIdx} className='flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition rounded-lg border border-gray-200'>
                            <div className='flex items-center gap-3 w-3/4'>
                              <FileText size={18} className='text-gray-400 flex-shrink-0' />
                              <button onClick={() => handleDownloadDocument(doc.File_Path)} className='text-sm text-blue-600 hover:underline text-left truncate cursor-pointer'>
                                {doc.Document_Name || doc.File_Path}
                              </button>
                            </div>
                            <div className='flex items-center gap-3'>
                              <span className='text-xs text-gray-400 bg-white px-2 py-0.5 rounded border hidden sm:block'>{doc.Document_Type}</span>
                              <button onClick={() => handleDownloadDocument(doc.File_Path)} className='text-gray-500 hover:text-blue-600 bg-white p-1.5 rounded-md shadow-sm border cursor-pointer transition-colors'>
                                <Download size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className='lg:col-span-1 space-y-6'>
          {/* Payment Details */}
          <div className='bg-white rounded-xl border border-gray-200 p-5'>
            <h2 className='text-base font-semibold text-gray-800 mb-4'>Payment Info</h2>
            <div className='space-y-3'>
              <div className='flex justify-between pb-3 border-b border-gray-50'>
                <span className='text-sm text-gray-500'>Status</span>
                <span className={`text-sm font-bold ${request.Payment_Status === 'Completed' ? 'text-green-600' : 'text-amber-600'}`}>
                  {request.Payment_Status}
                </span>
              </div>
              <div className='flex justify-between pb-3 border-b border-gray-50'>
                <span className='text-sm text-gray-500'>Amount</span>
                <span className='text-sm font-semibold text-gray-800'>₹{request.Amount}</span>
              </div>
              {request.Payment_Status === 'Completed' && (
                <>
                  <div className='flex justify-between pb-3 border-b border-gray-50'>
                    <span className='text-sm text-gray-500'>Method</span>
                    <span className='text-sm font-semibold text-gray-800'>{request.Payment_Method || 'UPI'}</span>
                  </div>
                  <div className='flex justify-between pb-3 border-b border-gray-50'>
                    <span className='text-sm text-gray-500'>Date</span>
                    <span className='text-sm font-semibold text-gray-800'>{formatDate(request.Payment_Date)}</span>
                  </div>
                  <div className='pt-2'>
                    <button onClick={() => handleDownloadReceipt(request.Request_ID)} className='w-full py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-semibold rounded-lg transition flex justify-center items-center gap-2 cursor-pointer border border-gray-200'>
                      <FileText size={16} /> Download Receipt
                    </button>
                  </div>
                </>
              )}
            </div>
            {request.Payment_Status === 'Pending' && request.Status !== 'Rejected' && (
              <button 
                onClick={() => navigate(`/verifier/payment/${request.Request_ID}`, { 
                  state: { 
                    amount: request.Amount, 
                    reqId: request.Request_ID, 
                    qualsCount: qualifications.length 
                  } 
                })} 
                disabled={qualifications.some(q => q.Consent_Status === 'Denied')}
                className={`w-full mt-4 py-2 text-sm font-semibold rounded-lg transition ${qualifications.some(q => q.Consent_Status === 'Denied') ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'}`}
              >
                {qualifications.some(q => q.Consent_Status === 'Denied') 
                  ? 'Cannot Pay (Consent Denied)' 
                  : 'Complete Payment Process'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RequestDetail
