import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CheckCircle, Building, ChevronRight } from 'lucide-react'
import { useContext } from 'react'
import { dataContext } from '../context/UserContext.jsx'
import axios from 'axios'
import toast from 'react-hot-toast'


const CertificateVerify = () => {
  const { serverUrl } = useContext(dataContext)
  const [certNumber, setCertNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!certNumber.trim()) return
    setLoading(true)
    try {
      const { data } = await axios.get(serverUrl + '/api/public/verify/' + certNumber)
      setResult(data)
    } catch (error) {
      if (error.response?.status === 404) {
        setResult({ valid: false })
      } else {
        toast.error('Something went wrong')
      }
    }
    setLoading(false)
  }

  return (
    <div className='min-h-[calc(100vh-120px)] flex flex-col'>
      {/* Hero */}
      <section className='bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-700 text-white py-14 sm:py-20 px-4'>
        <div className='max-w-2xl mx-auto text-center'>
          <div className='w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <Search size={28} className='text-white' />
          </div>
          <h1 className='text-2xl sm:text-4xl font-bold mb-3 font-[Poppins]'>Verify a Certificate</h1>
          <p className='text-blue-100 text-sm sm:text-base mb-8'>Enter a certificate number to check its authenticity in real-time.</p>
          <form onSubmit={handleSearch} className='flex flex-col sm:flex-row gap-3 max-w-lg mx-auto'>
            <input type="text" value={certNumber} onChange={(e) => setCertNumber(e.target.value)} placeholder='e.g., V-CERT-XXXXX-XXXXX' className='flex-1 h-12 pl-5 text-sm rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-white/50 outline-none focus:border-white/50 backdrop-blur-sm transition' />
            <button type="submit" disabled={loading} className='h-12 px-8 bg-white text-blue-700 font-bold text-sm rounded-xl hover:shadow-xl hover:shadow-white/20 transition-all disabled:opacity-50 cursor-pointer'>
              {loading ? 'Searching...' : 'Verify'}
            </button>
          </form>
        </div>
      </section>

      {/* Result */}
      {result && (
        <section className='py-12 px-4'>
          <div className='max-w-2xl mx-auto'>
            {result.valid ? (
              <div className='bg-white rounded-2xl border-2 border-emerald-400 shadow-xl shadow-emerald-100/50 overflow-hidden animate-fade-in'>
                <div className='bg-emerald-50 p-6 sm:p-8 text-center border-b border-emerald-200'>
                  <div className='w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm'>
                    <CheckCircle size={36} className='text-emerald-600' />
                  </div>
                  <h2 className='text-xl sm:text-2xl font-bold text-emerald-700'>✅ Certificate is Valid</h2>
                  <p className='text-sm text-emerald-600 mt-1'>This qualification has been verified and authenticated.</p>
                </div>
                <div className='p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                  {[
                    { label: 'Student', value: result.certificate.Student_Name },
                    { label: 'Certificate #', value: result.certificate.Certificate_Number },
                    { label: 'Degree', value: result.certificate.Degree_Name },
                    { label: 'Institution', value: result.certificate.Institution_Name },
                    { label: 'Grade', value: `${result.certificate.Grade} (${result.certificate.Percentage}%)` },
                    { label: 'Valid Until', value: result.certificate.Valid_Until },
                  ].map((item, i) => (
                    <div key={i}>
                      <p className='text-[11px] text-gray-400 font-bold uppercase tracking-wider'>{item.label}</p>
                      <p className='font-semibold text-gray-800 mt-0.5'>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className='bg-white rounded-2xl border-2 border-red-300 p-8 text-center animate-fade-in'>
                <p className='text-4xl mb-3'>❌</p>
                <h2 className='text-xl font-bold text-red-600'>Certificate Not Found</h2>
                <p className='text-sm text-gray-500 mt-2'>No record matches this certificate number. Double-check and try again.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default CertificateVerify
