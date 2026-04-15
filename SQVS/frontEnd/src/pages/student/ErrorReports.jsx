import React, { useState, useEffect } from 'react'
import { AlertTriangle, Clock, CheckCircle, Send, Plus, X } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const ErrorReports = () => {
  const [reports, setReports] = useState([])
  const [qualifications, setQualifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    qualificationId: '',
    description: ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [reportsRes, qualsRes] = await Promise.all([
        api.get('/student/error-reports'),
        api.get('/student/qualifications')
      ])
      setReports(reportsRes.data.reports || [])
      setQualifications(qualsRes.data.qualifications || [])
    } catch (error) {
      toast.error('Failed to load data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.qualificationId || !formData.description) {
      return toast.error('Please fill all fields')
    }

    setSubmitting(true)
    try {
      await api.post('/student/error-reports', formData)
      toast.success('Error report submitted successfully')
      setModalOpen(false)
      setFormData({ qualificationId: '', description: '' })
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      Open: 'bg-red-100 text-red-700',
      Under_Review: 'bg-yellow-100 text-yellow-700',
      Resolved: 'bg-green-100 text-green-700',
      Closed: 'bg-gray-100 text-gray-700'
    }
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[status] || styles.Open}`}>{status.replace('_', ' ')}</span>
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
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Error Reports</h1>
          <p className='text-sm text-gray-500'>Report and track issues with your academic qualifications.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className='flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition cursor-pointer'
        >
          <Plus size={18} /> Report Issue
        </button>
      </div>

      {reports.length === 0 ? (
        <div className='bg-white rounded-xl border border-gray-200 p-10 text-center'>
          <CheckCircle size={40} className='text-green-500 mx-auto mb-3' />
          <p className='text-lg font-semibold text-gray-800'>No Reports Found</p>
          <p className='text-sm text-gray-500 mt-1'>You haven't submitted any error reports yet.</p>
        </div>
      ) : (
        <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
          <table className='w-full text-left border-collapse'>
            <thead className='bg-gray-50 text-gray-600 text-xs uppercase font-bold'>
              <tr>
                <th className='px-6 py-4'>Qualification</th>
                <th className='px-6 py-4'>Issue Description</th>
                <th className='px-6 py-4'>Status</th>
                <th className='px-6 py-4'>Date Reported</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {reports.map(report => (
                <tr key={report.Report_ID} className='text-sm text-gray-700 hover:bg-gray-50 transition'>
                  <td className='px-6 py-4 font-semibold'>{report.Degree_Name}</td>
                  <td className='px-6 py-4 max-w-xs truncate'>{report.Issue_Description}</td>
                  <td className='px-6 py-4'>{getStatusBadge(report.Status)}</td>
                  <td className='px-6 py-4'>{new Date(report.Report_Date).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Modal */}
      {modalOpen && (
        <div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4'>
          <div className='bg-white rounded-xl max-w-md w-full shadow-2xl'>
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100'>
              <h2 className='text-lg font-bold text-gray-800'>Report Qualification Issue</h2>
              <button onClick={() => setModalOpen(false)} className='text-gray-400 hover:text-gray-600 cursor-pointer'><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>Select Qualification</label>
                <select 
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                  value={formData.qualificationId}
                  onChange={(e) => setFormData({ ...formData, qualificationId: e.target.value })}
                >
                  <option value="">Select a qualification...</option>
                  {qualifications.map(q => (
                    <option key={q.Qualification_ID} value={q.Qualification_ID}>{q.Degree_Name} ({new Date(q.Completion_Date).getFullYear()})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>Describe the Issue</label>
                <textarea 
                  rows="4"
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none'
                  placeholder='Tell us what is wrong with this qualification data...'
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className='w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2'
              >
                {submitting ? 'Submitting...' : <><Send size={18} /> Submit Report</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ErrorReports
