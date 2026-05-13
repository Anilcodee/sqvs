import React, { useState, useEffect } from 'react'
import { UserPlus, Shield, Mail, Phone, Briefcase, Lock, X, CheckCircle, Trash2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const OfficialOnboarding = () => {
  const [officials, setOfficials] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: '',
    phone: '',
    password: ''
  })

  const fetchOfficials = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/admin/officials')
      setOfficials(data.officials || [])
    } catch (error) {
      toast.error('Failed to load ministry officials')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOfficials()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/admin/officials', form)
      toast.success('Ministry official added successfully')
      setModal(false)
      setForm({ name: '', email: '', department: '', phone: '', password: '' })
      fetchOfficials()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add official')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && officials.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  return (
    <div className='max-w-6xl mx-auto p-2'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
            <Shield className='text-purple-600' size={28} />
            Ministry Internal Onboarding
          </h1>
          <p className='text-sm text-gray-500 mt-1'>Manage high-level system administrators and ministry officials.</p>
        </div>
        <button 
          onClick={() => setModal(true)}
          className='flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition cursor-pointer'
        >
          <UserPlus size={18} /> Onboard New Official
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {officials.map((off) => (
          <div key={off.Official_ID} className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition group relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110'></div>
            
            <div className='flex items-center gap-4 mb-4 relative'>
              <div className='w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold text-lg border border-purple-200'>
                {off.Name?.charAt(0)}
              </div>
              <div>
                <h3 className='font-bold text-gray-800'>{off.Name}</h3>
                <span className='px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider'>{off.Status}</span>
              </div>
            </div>

            <div className='space-y-3 relative'>
              <div className='flex items-center gap-2.5 text-sm text-gray-600'>
                <Mail size={14} className='text-gray-400' />
                <span className='truncate'>{off.Email}</span>
              </div>
              <div className='flex items-center gap-2.5 text-sm text-gray-600'>
                <Briefcase size={14} className='text-gray-400' />
                <span>{off.Department}</span>
              </div>
              {off.Phone && (
                <div className='flex items-center gap-2.5 text-sm text-gray-600'>
                  <Phone size={14} className='text-gray-400' />
                  <span>{off.Phone}</span>
                </div>
              )}
            </div>

            <div className='mt-5 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400'>
              <span>Onboarded: {new Date(off.Created_At).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {officials.length === 0 && (
        <div className='bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center'>
          <Shield size={48} className='text-gray-200 mx-auto mb-4' />
          <p className='text-gray-500 font-medium'>No internal officials found.</p>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'>
          <div className='bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200'>
            <div className='px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50'>
              <div>
                <h2 className='text-xl font-bold text-gray-800'>Internal Onboarding</h2>
                <p className='text-xs text-gray-500'>Register a new Ministry Official with full system access.</p>
              </div>
              <button onClick={() => setModal(false)} className='p-2 hover:bg-white rounded-full text-gray-400 hover:text-gray-600 transition cursor-pointer'><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className='p-8 space-y-5'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='col-span-2'>
                  <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5'>Full Name</label>
                  <div className='relative'>
                    <Shield size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                    <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required 
                      className='w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 outline-none transition text-sm bg-gray-50' placeholder='Admin Name' />
                  </div>
                </div>
                
                <div className='col-span-2'>
                  <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5'>Email Address</label>
                  <div className='relative'>
                    <Mail size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                    <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required 
                      className='w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 outline-none transition text-sm bg-gray-50' placeholder='admin@sqvs.gov.in' />
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5'>Department</label>
                  <div className='relative'>
                    <Briefcase size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                    <input type="text" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} required 
                      className='w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 outline-none transition text-sm bg-gray-50' placeholder='e.g. Higher Education' />
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5'>Phone (Optional)</label>
                  <div className='relative'>
                    <Phone size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                    <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                      className='w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 outline-none transition text-sm bg-gray-50' placeholder='10-digit number' />
                  </div>
                </div>

                <div className='col-span-2'>
                  <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5'>System Password</label>
                  <div className='relative'>
                    <Lock size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                    <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required minLength={6}
                      className='w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 outline-none transition text-sm bg-gray-50' placeholder='••••••••' />
                  </div>
                  <p className='text-[10px] text-gray-400 mt-2 italic'>* This user will have high-level administrative access to approvals and system logs.</p>
                </div>
              </div>

              <div className='pt-4'>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className='w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold rounded-xl hover:shadow-xl transition disabled:opacity-50 cursor-pointer text-sm tracking-wide'
                >
                  {submitting ? 'Processing Onboarding...' : 'Authorize & Onboard Official'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default OfficialOnboarding
