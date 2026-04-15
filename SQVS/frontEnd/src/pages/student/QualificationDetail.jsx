import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Download, FileText, Clock, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const QualificationDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [qualification, setQualification] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const { data } = await api.get(`/student/qualifications/${id}`)
        setQualification(data.qualification)
        setDocuments(data.documents || [])
      } catch (error) {
        toast.error('Failed to load qualification details')
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
    if (status === 'Verified') return <span className='px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full flex items-center gap-1'><CheckCircle size={12} /> Verified</span>
    if (status === 'Pending') return <span className='px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full flex items-center gap-1'><Clock size={12} /> Pending</span>
    return <span className='px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full flex items-center gap-1'><AlertTriangle size={12} /> Rejected</span>
  }

  const handleDownloadDocument = async (fileName) => {
    try {
      const response = await api.get(`/student/documents/${fileName}`, { responseType: 'blob' })
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

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  if (!qualification) {
    return (
      <div className='text-center py-20'>
        <p className='text-gray-500'>Qualification not found.</p>
        <button onClick={() => navigate('/student/dashboard')} className='text-blue-600 font-semibold mt-2 hover:underline cursor-pointer'>Go back to dashboard</button>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className='flex items-center gap-2 text-sm text-gray-500 mb-6'>
        <Link to="/student/dashboard" className='hover:text-blue-600 transition'>Dashboard</Link>
        <span>/</span>
        <span className='text-gray-800 font-medium'>{qualification.Degree_Name}</span>
      </div>

      <button onClick={() => navigate(-1)} className='flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4 transition cursor-pointer'>
        <ArrowLeft size={16} /> Back
      </button>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Info */}
        <div className='lg:col-span-2 space-y-6'>
          <div className='bg-white rounded-xl border border-gray-200 p-6'>
            <div className='flex items-start justify-between mb-4'>
              <div>
                <h1 className='text-xl font-bold text-gray-800'>{qualification.Degree_Name}</h1>
                <p className='text-sm text-gray-500 mt-1'>{qualification.Institution_Name}</p>
              </div>
              {getStatusBadge(qualification.Status)}
            </div>

            <div className='grid grid-cols-2 gap-4 mt-4'>
              <div>
                <p className='text-xs text-gray-500'>Certificate Number</p>
                <p className='text-sm font-semibold text-gray-800'>{qualification.Certificate_Number}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Qualification Level</p>
                <p className='text-sm font-semibold text-gray-800'>{qualification.Qualification_Level}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Field of Study</p>
                <p className='text-sm font-semibold text-gray-800'>{qualification.Field_of_Study}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Duration</p>
                <p className='text-sm font-semibold text-gray-800'>{formatDate(qualification.Enrollment_Date)} – {formatDate(qualification.Completion_Date)}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Final Grade</p>
                <p className='text-sm font-semibold text-gray-800'>{qualification.Grade || 'N/A'} {qualification.Percentage ? `(${qualification.Percentage}%)` : ''}</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Total / Obtained Marks</p>
                <p className='text-sm font-semibold text-gray-800'>{qualification.Marks_Obtained || '–'} / {qualification.Total_Marks || '–'}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className='bg-white rounded-xl border border-gray-200'>
            <div className='px-5 py-4 border-b border-gray-200'>
              <h2 className='text-base font-semibold text-gray-800'>Supporting Documents</h2>
            </div>
            {documents.length === 0 ? (
              <div className='px-5 py-6 text-center text-sm text-gray-400'>No documents uploaded yet.</div>
            ) : (
              <div className='divide-y divide-gray-100'>
                {documents.map((doc, i) => (
                  <div key={i} className='px-5 py-3 flex items-center justify-between'>
                    <div className='flex items-center gap-3 overflow-hidden'>
                      <FileText size={18} className='text-gray-400 shrink-0' />
                      <button onClick={() => handleDownloadDocument(doc.Document_Path)} className='text-sm text-blue-600 hover:underline text-left cursor-pointer truncate'>
                        {doc.Document_Type} - {doc.Document_Path.split('-').slice(-1)[0]}
                      </button>
                    </div>
                    <div className='flex items-center gap-4 shrink-0 px-2'>
                      <span className='text-xs text-gray-400 hidden sm:block'>{doc.Document_Type}</span>
                      <button onClick={() => handleDownloadDocument(doc.Document_Path)} className='text-gray-400 hover:text-blue-600 cursor-pointer'>
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className='lg:col-span-1'>
          <div className='bg-white rounded-xl border border-gray-200 p-5'>
            <h2 className='text-base font-semibold text-gray-800 mb-4'>Verification Details</h2>
            <div className='space-y-4'>
              <div className='flex gap-3'>
                <div className='flex flex-col items-center'>
                  <div className={`w-3 h-3 rounded-full mt-1 ${qualification.Status === 'Verified' ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                  <div className='w-0.5 flex-1 bg-gray-200 mt-1'></div>
                </div>
                <div className='pb-4'>
                  <p className='text-sm text-gray-800 font-medium'>
                    {qualification.Status === 'Verified' ? 'Verification completed' : qualification.Status === 'Rejected' ? 'Verification rejected' : 'Awaiting verification'}
                  </p>
                  <p className='text-xs text-gray-400 mt-0.5'>
                    {qualification.Verification_Date ? formatDate(qualification.Verification_Date) : 'Pending'}
                  </p>
                  {qualification.VerifiedByName && (
                    <p className='text-xs text-gray-400'>By: {qualification.VerifiedByName}</p>
                  )}
                </div>
              </div>
              <div className='flex gap-3'>
                <div className='flex flex-col items-center'>
                  <div className='w-3 h-3 rounded-full mt-1 bg-blue-400'></div>
                </div>
                <div className='pb-4'>
                  <p className='text-sm text-gray-800 font-medium'>Record entered by institution</p>
                  <p className='text-xs text-gray-400 mt-0.5'>{formatDate(qualification.Created_At)}</p>
                  {qualification.EnteredByName && (
                    <p className='text-xs text-gray-400'>By: {qualification.EnteredByName}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QualificationDetail
