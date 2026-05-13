import React, { useState, useEffect, useContext } from 'react'
import { Plus, UserPlus, Mail, Shield, UserX, CheckCircle, AlertTriangle, X } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { dataContext } from '../../context/UserContext.jsx'

const StaffManagement = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { userData } = useContext(dataContext)
  
  // New member form
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Data_Entry_Operator',
    password: '',
    phone: ''
  })

  const fetchStaff = async () => {
    try {
      const { data } = await api.get('/staff/members')
      setStaff(data.staff)
    } catch (error) {
      toast.error('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/staff/members', form)
      toast.success('Staff member added successfully')
      setModal(false)
      setForm({ name: '', email: '', role: 'Data_Entry_Operator', password: '', phone: '' })
      fetchStaff()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add staff member')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  return (
    <div className='max-w-5xl mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Staff Management</h1>
          <p className='text-sm text-gray-400 mt-1'>Manage your institution's verification team members</p>
        </div>
        <button 
          onClick={() => setModal(true)}
          className='flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition cursor-pointer'
        >
          <UserPlus size={18} /> Add New Staff
        </button>
      </div>

      <div className='bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50/50'>
              <tr>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest'>Name</th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest'>Role</th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest'>Status</th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest'>Joined</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {staff.map((member) => (
                <tr key={member.Staff_ID} className='hover:bg-blue-50/20 transition'>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold'>
                        {member.Name?.charAt(0)}
                      </div>
                      <div>
                        <p className='text-sm font-bold text-gray-800'>{member.Name}</p>
                        <p className='text-[11px] text-gray-400'>{member.Email}</p>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <span className={`px-3 py-1 text-[11px] font-bold rounded-lg ${
                      member.Role === 'Administrator' ? 'bg-purple-100 text-purple-700' :
                      member.Role === 'Verifier' ? 'bg-amber-100 text-amber-700' :
                      member.Role === 'Data_Entry_Operator' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {member.Role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className='px-6 py-4'>
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${member.Status === 'Active' ? 'text-emerald-600' : 'text-red-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${member.Status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      {member.Status}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-400'>
                    {new Date(member.Created_At).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {staff.length === 0 && (
          <div className='py-20 text-center'>
            <div className='w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300'>
              <Shield size={32} />
            </div>
            <p className='text-gray-400 text-sm'>No other staff members found.</p>
          </div>
        )}
      </div>

      {modal && (
        <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4'>
          <div className='bg-white rounded-3xl max-w-md w-full shadow-2xl animate-fade-in'>
            <div className='px-6 py-5 border-b border-gray-100 flex justify-between items-center'>
              <h2 className='text-xl font-bold text-gray-800'>Add Staff Member</h2>
              <button onClick={() => setModal(false)} className='text-gray-400 hover:text-gray-600 transition cursor-pointer'><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className='p-6 space-y-4'>
              <div>
                <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5'>Full Name</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  required 
                  className='w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition text-sm bg-gray-50'
                  placeholder='Enter full name'
                />
              </div>
              <div>
                <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5'>Email Address</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  required 
                  className='w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition text-sm bg-gray-50'
                  placeholder='staff@institution.edu'
                />
              </div>
              <div>
                <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5'>Assign Role</label>
                <select 
                  value={form.role} 
                  onChange={(e) => setForm({...form, role: e.target.value})}
                  className='w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition text-sm bg-gray-50'
                >
                  <option value="Data_Entry_Operator">Data Entry Operator</option>
                  <option value="Verifier">Verifier</option>
                  <option value="Support">Support Staff</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
              <div>
                <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5'>Phone Number</label>
                <input 
                   type="text" 
                   value={form.phone} 
                   onChange={(e) => setForm({...form, phone: e.target.value})}
                   required 
                   className='w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition text-sm bg-gray-50'
                   placeholder='Enter phone number'
                   pattern='[0-9]{10,15}'
                 />
              </div>
              <div>
                <label className='block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5'>Initial Password</label>
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  required 
                  className='w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition text-sm bg-gray-50'
                  placeholder='Min. 6 characters'
                  minLength={6}
                />
              </div>
              
              <div className='pt-2'>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className='w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 cursor-pointer'
                >
                  {submitting ? 'Creating Account...' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffManagement
