import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Search, UserCheck, X } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { dataContext } from '../../context/UserContext.jsx'

const QualificationEntry = () => {
  const navigate = useNavigate()
  const { userData } = useContext(dataContext)
  const staffRole = userData?.staffRole

  React.useEffect(() => {
    if (staffRole && staffRole !== 'Data_Entry_Operator' && staffRole !== 'Support') {
      toast.error('Access denied. Insufficient permissions.')
      navigate('/staff/dashboard')
    }
  }, [staffRole, navigate])

  const [studentFound, setStudentFound] = useState(null)
  const [searchId, setSearchId] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [documents, setDocuments] = useState([])

  // Form state
  const [form, setForm] = useState({
    degreeName: '',
    level: 'Undergraduate',
    fieldOfStudy: '',
    enrollmentDate: '',
    completionDate: '',
    totalMarks: '',
    marksObtained: '',
    percentage: '',
    grade: ''
  })

  const handleSearch = async () => {
    if (!searchId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/staff/students/${searchId}`)
      setStudentFound(data.student)
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Student not found with that NED ID')
      } else {
        toast.error('Failed to search student')
      }
      setStudentFound(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + documents.length > 5) {
      toast.error('Maximum 5 documents allowed')
      return
    }
    
    // Check sizes
    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`File ${f.name} is too large (>5MB)`)
        return false
      }
      return true
    })
    
    setDocuments(prev => [...prev, ...validFiles])
  }

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!studentFound) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('nedId', studentFound.NED_ID)
      formData.append('level', form.level)
      formData.append('degreeName', form.degreeName)
      formData.append('fieldOfStudy', form.fieldOfStudy)
      formData.append('enrollmentDate', form.enrollmentDate)
      formData.append('completionDate', form.completionDate)
      
      if (form.totalMarks) formData.append('totalMarks', form.totalMarks)
      if (form.marksObtained) formData.append('marksObtained', form.marksObtained)
      if (form.percentage) formData.append('percentage', form.percentage)
      if (form.grade) formData.append('grade', form.grade)
      
      documents.forEach(doc => {
        formData.append('documents', doc)
      })

      const { data } = await api.post('/staff/qualifications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success(`Qualification added! Certificate: ${data.certificateNumber}`)
      navigate('/staff/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add qualification')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='flex items-center gap-2 text-sm text-gray-500 mb-6'>
        <Link to="/staff/dashboard" className='hover:text-blue-600 transition'>Workqueue</Link>
        <span>/</span>
        <span className='text-gray-800 font-medium'>New Qualification</span>
      </div>

      <h1 className='text-2xl font-bold text-gray-800 mb-6'>Add Qualification Record</h1>

      {/* Step 1: Find Student */}
      <div className='bg-white rounded-xl border border-gray-200 p-6 mb-6'>
        <h2 className='text-base font-semibold text-gray-800 mb-4'>Step 1: Locate Student</h2>
        <div className='flex gap-3'>
          <input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder='Enter NED ID (e.g., NED2024045)' 
            className='flex-1 h-10 pl-4 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition' />
          <button onClick={handleSearch} disabled={loading || studentFound} className='px-5 h-10 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer'>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {studentFound && (
          <div className='mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3'>
            <UserCheck size={24} className='text-green-600' />
            <div>
              <p className='text-sm font-semibold text-green-800'>{studentFound.Student_Name} ({studentFound.NED_ID})</p>
              <p className='text-xs text-green-700'>DOB: {formatDate(studentFound.Date_of_Birth)} • {studentFound.existingQualifications} existing qualifications</p>
            </div>
            <button onClick={() => { setStudentFound(null); setSearchId('') }} className='ml-auto text-sm text-green-700 hover:underline cursor-pointer'>Clear</button>
          </div>
        )}
      </div>

      {/* Step 2: Qualification Details */}
      {studentFound && (
        <form onSubmit={handleSubmit}>
          <div className='bg-white rounded-xl border border-gray-200 p-6 mb-6'>
            <h2 className='text-base font-semibold text-gray-800 mb-4'>Step 2: Qualification Details</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-gray-700'>Degree / Qualification Name <span className='text-red-500'>*</span></span>
                <input type="text" value={form.degreeName} onChange={(e) => handleFormChange('degreeName', e.target.value)} 
                  className='h-10 text-sm outline-none pl-3 rounded-lg border border-gray-300 hover:border-blue-500 transition focus:border-blue-500' placeholder='e.g., B.Com Honours' required />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-gray-700'>Qualification Level <span className='text-red-500'>*</span></span>
                <select value={form.level} onChange={(e) => handleFormChange('level', e.target.value)} className='h-10 text-sm pl-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500'>
                  <option>Undergraduate</option>
                  <option>Postgraduate</option>
                  <option>Diploma</option>
                  <option>Certificate</option>
                  <option>Secondary</option>
                  <option>Higher Secondary</option>
                  <option>Doctorate</option>
                </select>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-gray-700'>Field of Study <span className='text-red-500'>*</span></span>
                <input type="text" value={form.fieldOfStudy} onChange={(e) => handleFormChange('fieldOfStudy', e.target.value)} 
                  className='h-10 text-sm outline-none pl-3 rounded-lg border border-gray-300 hover:border-blue-500 transition focus:border-blue-500' placeholder='e.g., Computer Science' required />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-gray-700'>Grade</span>
                <input type="text" value={form.grade} onChange={(e) => handleFormChange('grade', e.target.value)} 
                  className='h-10 text-sm outline-none pl-3 rounded-lg border border-gray-300 hover:border-blue-500 transition focus:border-blue-500' placeholder='e.g., A+' />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-gray-700'>Enrollment Date <span className='text-red-500'>*</span></span>
                <input type="date" value={form.enrollmentDate} onChange={(e) => handleFormChange('enrollmentDate', e.target.value)} 
                  className='h-10 text-sm outline-none pl-3 rounded-lg border border-gray-300 hover:border-blue-500 transition focus:border-blue-500' required />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-gray-700'>Completion Date <span className='text-red-500'>*</span></span>
                <input type="date" value={form.completionDate} onChange={(e) => handleFormChange('completionDate', e.target.value)} 
                  className='h-10 text-sm outline-none pl-3 rounded-lg border border-gray-300 hover:border-blue-500 transition focus:border-blue-500' required />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-gray-700'>Total Marks</span>
                <input type="number" value={form.totalMarks} onChange={(e) => handleFormChange('totalMarks', e.target.value)} 
                  className='h-10 text-sm outline-none pl-3 rounded-lg border border-gray-300 hover:border-blue-500 transition focus:border-blue-500' placeholder='e.g., 600' />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-gray-700'>Marks Obtained</span>
                <input type="number" value={form.marksObtained} onChange={(e) => handleFormChange('marksObtained', e.target.value)} 
                  className='h-10 text-sm outline-none pl-3 rounded-lg border border-gray-300 hover:border-blue-500 transition focus:border-blue-500' placeholder='e.g., 510' />
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-sm text-gray-700'>Percentage</span>
                <input type="number" step="0.01" value={form.percentage} onChange={(e) => handleFormChange('percentage', e.target.value)} 
                  className='h-10 text-sm outline-none pl-3 rounded-lg border border-gray-300 hover:border-blue-500 transition focus:border-blue-500' placeholder='e.g., 85.00' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl border border-gray-200 p-6 mb-6'>
            <h2 className='text-base font-semibold text-gray-800 mb-4'>Step 3: Required Documents (Max 5)</h2>
            <div className='flex flex-col gap-4'>
              <div className='border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition'>
                <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} id="file-upload" className='hidden' />
                <label htmlFor="file-upload" className='cursor-pointer flex flex-col items-center justify-center gap-2'>
                  <div className='w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2'><Upload size={24} /></div>
                  <span className='font-medium text-gray-700'>Click to upload documents</span>
                  <span className='text-xs text-gray-500'>PDF, JPG, PNG up to 5MB each</span>
                </label>
              </div>
              
              {documents.length > 0 && (
                <div className='space-y-2'>
                  <p className='text-sm font-semibold text-gray-700'>Selected Documents:</p>
                  {documents.map((doc, idx) => (
                    <div key={idx} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100'>
                      <span className='text-sm text-gray-600 truncate'>{doc.name}</span>
                      <button type="button" onClick={() => removeDocument(idx)} className='text-red-500 hover:text-red-700 p-1'>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='flex gap-3 justify-end'>
            <button type="button" onClick={() => navigate('/staff/dashboard')} className='px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition cursor-pointer'>Cancel</button>
            <button type="submit" disabled={submitting} className='px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer'>
              {submitting ? 'Submitting...' : 'Submit Qualification'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default QualificationEntry
