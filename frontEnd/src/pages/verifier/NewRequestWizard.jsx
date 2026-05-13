import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, UserCheck, CheckCircle, ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const steps = ['Search Student', 'Select Qualifications', 'Purpose & Consent', 'Submit Request']

const NewRequestWizard = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchId, setSearchId] = useState('')
  const [student, setStudent] = useState(null)
  const [selectedQuals, setSelectedQuals] = useState([])
  const [purpose, setPurpose] = useState('Employment')
  const [declaration, setDeclaration] = useState(false)
  const [fees, setFees] = useState([])
  const [selectedFee, setSelectedFee] = useState(null)

  // Fetch fees on mount
  useEffect(() => {
    const fetchFees = async () => {
      try {
        const { data } = await api.get('/public/fees')
        setFees(data.fees || [])
        if (data.fees?.length > 0) setSelectedFee(data.fees[0])
      } catch (error) {
        console.error('Failed to fetch fees:', error)
      }
    }
    fetchFees()
  }, [])

  const handleSearch = async () => {
    if (!searchId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/verifier/search-student/${searchId}`)
      setStudent(data.student)
      setStudent(prev => ({ ...prev, quals: data.qualifications || [] }))
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Student not found or has no active status')
      } else {
        toast.error('Failed to search student')
      }
      setStudent(null)
    } finally {
      setLoading(false)
    }
  }

  const toggleQual = (id) => {
    setSelectedQuals(prev => prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id])
  }

  const baseFee = selectedFee?.Base_Fee || 500
  const total = selectedQuals.length * baseFee

  const canNext = () => {
    if (step === 0) return student !== null
    if (step === 1) return selectedQuals.length > 0
    if (step === 2) return declaration
    return true
  }

  const handlePay = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/verifier/requests', {
        nedId: student.NED_ID,
        qualificationIds: selectedQuals,
        purpose,
        feeId: selectedFee?.Fee_ID || 1
      })

      toast.success('Verification request created! Student has been notified for consent.')
      navigate('/verifier/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).getFullYear()
  }

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='flex items-center gap-2 text-sm text-gray-500 mb-6'>
        <Link to="/verifier/dashboard" className='hover:text-blue-600 transition'>Dashboard</Link>
        <span>/</span>
        <span className='text-gray-800 font-medium'>New Request</span>
      </div>

      <h1 className='text-2xl font-bold text-gray-800 mb-6'>Create Verification Request</h1>

      {/* Stepper */}
      <div className='flex items-center mb-8'>
        {steps.map((s, i) => (
          <div key={s} className='flex-1 flex items-center'>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
            <span className={`ml-2 text-xs font-medium hidden sm:block ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`}></div>}
          </div>
        ))}
      </div>

      <div className='bg-white rounded-xl border border-gray-200 p-6 mb-6 min-h-[300px]'>
        {/* Step 0: Search */}
        {step === 0 && (
          <div>
            <h2 className='text-lg font-semibold text-gray-800 mb-2'>Locate Student Records</h2>
            <p className='text-sm text-gray-500 mb-6'>Enter the student's NED ID to fetch their academic profile.</p>
            <div className='flex gap-3 mb-4'>
              <input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={student} placeholder='Enter NED ID (e.g., NED-XXXXX-XXXXX)'
                className='flex-1 h-12 pl-4 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition disabled:opacity-50' />
              <button onClick={handleSearch} disabled={!searchId || loading || student} className='px-5 h-12 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer'>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {student && (
              <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3'>
                <UserCheck size={24} className='text-green-600' />
                <div>
                  <p className='text-sm font-semibold text-green-800'>{student.Student_Name} ({student.NED_ID})</p>
                  <p className='text-xs text-green-700'>{student.quals?.length || 0} Verified Qualifications Found</p>
                </div>
                <button onClick={() => { setStudent(null); setSelectedQuals([]) }} className='ml-auto text-sm text-green-700 hover:underline cursor-pointer'>Clear</button>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Select */}
        {step === 1 && (
          <div>
            <h2 className='text-lg font-semibold text-gray-800 mb-4'>Select Qualifications to Verify</h2>
            {student?.quals?.length === 0 ? (
              <div className='text-center py-8 text-gray-400 text-sm'>No verified qualifications found for this student.</div>
            ) : (
              <div className='space-y-3 mb-6'>
                {student?.quals?.map(q => (
                  <div key={q.Qualification_ID} onClick={() => toggleQual(q.Qualification_ID)} className={`p-4 rounded-lg border-2 cursor-pointer transition ${selectedQuals.includes(q.Qualification_ID) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <input type="checkbox" checked={selectedQuals.includes(q.Qualification_ID)} readOnly className='w-4 h-4' />
                        <div>
                          <p className='text-sm font-semibold text-gray-800'>{q.Degree_Name} ({q.Institution_Name})</p>
                          <p className='text-xs text-gray-500'>Completed: {formatDate(q.Completion_Date)} • Level: {q.Qualification_Level}</p>
                        </div>
                      </div>
                      <p className='text-sm font-semibold text-gray-700'>₹{baseFee}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className='bg-gray-50 rounded-lg p-4 flex items-center justify-between'>
              <p className='text-sm text-gray-600'>Selected: <strong>{selectedQuals.length} qualifications</strong></p>
              <p className='text-lg font-bold text-gray-800'>Total: ₹{total}.00</p>
            </div>
          </div>
        )}

        {/* Step 2: Purpose */}
        {step === 2 && (
          <div>
            <h2 className='text-lg font-semibold text-gray-800 mb-4'>Verification Purpose</h2>
            <div className='space-y-2 mb-6'>
              {['Employment', 'Education', 'Visa', 'Other'].map(p => (
                <label key={p} className='flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition'>
                  <input type="radio" name="purpose" value={p} checked={purpose === p} onChange={() => setPurpose(p)} className='w-4 h-4' />
                  <span className='text-sm text-gray-700'>{p === 'Employment' ? 'Employment Background Check' : p === 'Education' ? 'Higher Education Admission' : p === 'Visa' ? 'Visa / Immigration Processing' : 'Other Purpose'}</span>
                </label>
              ))}
            </div>

            {fees.length > 1 && (
              <div className='mb-6'>
                <p className='text-sm font-semibold text-gray-700 mb-2'>Select Fee Plan:</p>
                <div className='space-y-2'>
                  {fees.map(fee => (
                    <label key={fee.Fee_ID} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedFee?.Fee_ID === fee.Fee_ID ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <input type="radio" name="fee" checked={selectedFee?.Fee_ID === fee.Fee_ID} onChange={() => setSelectedFee(fee)} className='w-4 h-4' />
                      <span className='text-sm text-gray-700'>{fee.Purpose} — ₹{fee.Base_Fee}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
              <p className='text-sm text-yellow-800'><strong>Student Consent Required:</strong> {student?.Student_Name} must approve this request before you can access verification results.</p>
            </div>
            <label className='flex items-start gap-3 bg-gray-50 rounded-lg p-4 cursor-pointer'>
              <input type="checkbox" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} className='w-4 h-4 mt-0.5' />
              <span className='text-xs text-gray-600'>I declare that my organization has a legitimate basis for requesting this information and will handle the data in compliance with privacy laws.</span>
            </label>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h2 className='text-lg font-semibold text-gray-800 mb-4'>Review & Submit</h2>
            <div className='grid grid-cols-2 gap-3 text-sm mb-6'>
              <div><p className='text-xs text-gray-500'>Student</p><p className='font-medium'>{student?.Student_Name}</p></div>
              <div><p className='text-xs text-gray-500'>Qualifications</p><p className='font-medium'>{selectedQuals.length}</p></div>
              <div><p className='text-xs text-gray-500'>Purpose</p><p className='font-medium capitalize'>{purpose}</p></div>
            </div>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
              <p className='text-sm text-blue-800 font-medium'>
                <ShieldCheck className='inline-block mr-1' size={16} /> 
                Request will be sent to the student. You will be able to complete the payment of <strong>₹{total}</strong> once the student grants consent.
              </p>
            </div>
            <button onClick={handlePay} disabled={loading} className='w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer'>
              {loading ? 'Processing...' : <><CheckCircle size={18} /> Confirm & Create Request</>}
            </button>
            <p className='text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1'><ShieldCheck size={14} /> Secure 256-bit encrypted checkout</p>
          </div>
        )}
      </div>

      {/* Nav Buttons */}
      <div className='flex justify-between'>
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className='px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition disabled:opacity-30 flex items-center gap-2 cursor-pointer'>
          <ArrowLeft size={16} /> Back
        </button>
        {step < 3 && (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className='px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer'>
            Continue →
          </button>
        )}
      </div>
    </div>
  )
}

export default NewRequestWizard
