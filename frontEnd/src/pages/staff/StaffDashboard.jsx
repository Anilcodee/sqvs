import React, { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertTriangle, CheckCircle, X, Building, Clock, PlusCircle, Bell, ChevronUp, ChevronDown } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { dataContext } from '../../context/UserContext.jsx'

const StaffDashboard = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [stats, setStats] = useState({ pending: 0, verifiedToday: 0, total: 0, instStatus: 'Approved' })
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [notifModal, setNotifModal] = useState(false)
  const [notifMessage, setNotifMessage] = useState('')
  const [notifTarget, setNotifTarget] = useState('') 
  const [sortConfig, setSortConfig] = useState({ key: 'Created_At', direction: 'DESC' })
  const { userData } = useContext(dataContext)
  const staffRole = userData?.staffRole
  const requestCount = useRef(0)

  const fetchData = async (searchTerm = debouncedSearch) => {
    const currentRequestId = ++requestCount.current
    if (queue.length === 0) setLoading(true)
    else setSearching(true)
    
    try {
      const [dashRes, queueRes] = await Promise.all([
        api.get('/staff/dashboard'),
        api.get(`/staff/queue?all=true&search=${searchTerm}&sortBy=${sortConfig.key}&sortDir=${sortConfig.direction}`)
      ])
      
      if (currentRequestId === requestCount.current) {
        setStats(dashRes.data.stats)
        setQueue(queueRes.data.queue || [])
      }
    } catch (error) {
      if (currentRequestId === requestCount.current) {
        toast.error('Failed to load dashboard data')
        console.error(error)
      }
    } finally {
      if (currentRequestId === requestCount.current) {
        setLoading(false)
        setSearching(false)
      }
    }
  }

  const fetchStaffMembers = async () => {
    if (staffRole !== 'Administrator') return
    try {
      const { data } = await api.get('/staff/queue') // We can use queue to get some staff emails, but ideally we'd have a staff list endpoint
      const emails = [...new Set(data.queue.map(q => q.Student_Email))] // Mocking staff emails from existing data for now if no specific endpoint
      // Actually, let's just assume we'll have a specific endpoint or use a dummy list for demonstration if needed, 
      // but the user wants to notify "other three" (DEO, Verifier, Support).
      // Let's call a hypothetical endpoint or just show a text area for emails.
    } catch (e) {}
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchData(debouncedSearch)
  }, [debouncedSearch, sortConfig])

  const handleSort = (key) => {
    let direction = 'ASC'
    if (sortConfig.key === key && sortConfig.direction === 'ASC') {
      direction = 'DESC'
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronUp size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    return sortConfig.direction === 'ASC' ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />
  }



  const handleVerify = async (qualId, status) => {
    setActionLoading(true)
    try {
      await api.put(`/staff/qualifications/${qualId}/verify`, { status })
      toast.success(`Qualification ${status.toLowerCase()} successfully`)
      setModal(null)
      await fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update qualification')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendNotification = async () => {
    if (!notifMessage || !notifTarget) return
    setActionLoading(true)
    try {
      await api.post('/staff/notifications', { 
        targetEmails: notifTarget.split(',').map(e => e.trim()), 
        message: notifMessage 
      })
      toast.success('Notification sent to staff')
      setNotifModal(false)
      setNotifMessage('')
      setNotifTarget('')
    } catch (error) {
      toast.error('Failed to send notification')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const filtered = queue // Filtering now happens on backend

  if (loading) {
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
          <h1 className='text-xl sm:text-2xl font-bold text-gray-800'>Staff Workqueue</h1>
          <div className='flex items-center gap-2 mt-0.5'>
            <p className='text-sm text-gray-400'>Logged in as <span className='font-semibold text-gray-600'>{staffRole?.replace(/_/g, ' ')}</span></p>
            {stats.status === 'Inactive' && (
              <span className='px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded flex items-center gap-1'>
                <AlertTriangle size={10} /> Account Inactive
              </span>
            )}
          </div>
        </div>
        
        <div className='flex gap-2'>
          {(staffRole === 'Data_Entry_Operator' || staffRole === 'Support') && (
            <button onClick={() => navigate('/staff/qualifications/new')} className='px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-sm flex items-center gap-2 cursor-pointer'>
              <PlusCircle size={18} /> Add Qualification
            </button>
          )}
          {staffRole === 'Administrator' && (
            <button onClick={() => setNotifModal(true)} className='px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition shadow-sm flex items-center gap-2 cursor-pointer'>
              <Bell size={18} /> Notify Staff
            </button>
          )}
        </div>
      </div>

      {stats.status === 'Inactive' && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3'>
          <div className='w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0'>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className='text-sm font-bold text-red-800'>Account Restricted</h3>
            <p className='text-xs text-red-700 mt-1'>
              {stats.instStatus === 'Pending' 
                ? 'Your institution registration is currently pending admin approval. You can view records but cannot perform actions until approved.' 
                : 'Your account is currently inactive. You can view existing records but cannot add or verify qualifications. Please contact your administrator.'}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6'>
        {[
          { label: 'Pending', value: stats.pending, color: 'from-amber-500 to-orange-500', icon: <Clock size={20} /> },
          { label: 'Verified Today', value: stats.verifiedToday, color: 'from-emerald-500 to-teal-500', icon: <CheckCircle size={20} /> },
          { label: 'Total Records', value: stats.total, color: 'from-blue-500 to-indigo-500', icon: <Building size={20} /> },
        ].map((s, i) => (
          <div key={i} className='bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all group'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-400 font-medium'>{s.label}</p>
                <p className='text-3xl font-extrabold text-gray-800 mt-1'>{s.value}</p>
              </div>
              <div className={`w-11 h-11 bg-gradient-to-br ${s.color} text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar with Loading Indicator */}
      <div className='mb-4'>
        <div className='relative'>
          <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searching ? 'text-blue-500' : 'text-gray-400'}`} />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder='Search by student name or NED ID...' 
            className='w-full h-11 pl-11 pr-12 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition bg-white' 
          />
          {searching && (
            <div className='absolute right-4 top-1/2 -translate-y-1/2'>
              <div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className='text-center py-10 text-gray-400 text-sm'>No qualifications in queue.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className='hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-50/80'>
                <tr>
                  <th onClick={() => handleSort('Certificate_Number')} className='text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 cursor-pointer group'>
                    <div className="flex items-center gap-1">ID {getSortIcon('Certificate_Number')}</div>
                  </th>
                  <th onClick={() => handleSort('Student_Name')} className='text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 cursor-pointer group'>
                    <div className="flex items-center gap-1">Student {getSortIcon('Student_Name')}</div>
                  </th>
                  <th onClick={() => handleSort('Degree_Name')} className='text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 cursor-pointer group'>
                    <div className="flex items-center gap-1">Qualification {getSortIcon('Degree_Name')}</div>
                  </th>
                  <th onClick={() => handleSort('Grade')} className='text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 cursor-pointer group'>
                    <div className="flex items-center gap-1">Grade {getSortIcon('Grade')}</div>
                  </th>
                  <th onClick={() => handleSort('Status')} className='text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 cursor-pointer group'>
                    <div className="flex items-center gap-1">Status {getSortIcon('Status')}</div>
                  </th>
                  <th className='text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {filtered.map(item => (
                  <tr key={item.Qualification_ID} className='hover:bg-blue-50/30 transition'>
                    <td className='px-5 py-3.5 text-sm text-gray-400 font-mono'>{item.Certificate_Number}</td>
                    <td className='px-5 py-3.5'>
                      <p className='text-sm font-semibold text-gray-800'>{item.Student_Name}</p>
                      <p className='text-[11px] text-gray-400'>{item.NED_ID}</p>
                    </td>
                    <td className='px-5 py-3.5 text-sm text-gray-600'>{item.Degree_Name} ({item.Qualification_Level})</td>
                    <td className='px-5 py-3.5 text-sm text-gray-600'>{item.Grade || `${item.Percentage}%`}</td>
                    <td className='px-5 py-3.5'>
                      {item.Status === 'Verified'
                        ? <span className='px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-700 rounded-full'>Verified</span>
                        : item.Status === 'Rejected'
                        ? <span className='px-2.5 py-1 text-[11px] font-bold bg-red-100 text-red-700 rounded-full'>Rejected</span>
                        : <span className='px-2.5 py-1 text-[11px] font-bold bg-amber-100 text-amber-700 rounded-full'>Pending</span>
                      }
                    </td>
                    <td className='px-5 py-3.5'>
                      {item.Status === 'Pending' ? (
                        (staffRole === 'Verifier' || staffRole === 'Support') ? (
                          <button 
                            onClick={() => setModal(item)} 
                            disabled={stats.status === 'Inactive'}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${stats.status === 'Inactive' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md cursor-pointer'}`}
                          >
                            Verify
                          </button>
                        ) : (
                          <span className='text-xs text-gray-400 italic'>No Access</span>
                        )
                      ) : <span className='text-xs text-gray-400'>Done</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className='md:hidden space-y-3'>
            {filtered.map(item => (
              <div key={item.Qualification_ID} className='bg-white rounded-2xl border border-gray-200 p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <span className='text-xs text-gray-400 font-mono'>{item.Certificate_Number}</span>
                  {item.Status === 'Verified'
                    ? <span className='px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-700 rounded-full'>Verified</span>
                    : item.Status === 'Rejected'
                    ? <span className='px-2.5 py-1 text-[11px] font-bold bg-red-100 text-red-700 rounded-full'>Rejected</span>
                    : <span className='px-2.5 py-1 text-[11px] font-bold bg-amber-100 text-amber-700 rounded-full'>Pending</span>
                  }
                </div>
                <p className='text-sm font-bold text-gray-800'>{item.Student_Name} <span className='text-gray-400 font-normal'>({item.NED_ID})</span></p>
                <p className='text-xs text-gray-500 mt-1'>{item.Degree_Name} ({item.Qualification_Level})</p>
                <p className='text-xs text-gray-400 mt-1'>Grade: {item.Grade || `${item.Percentage}%`}</p>
                {item.Status === 'Pending' && (
                  (staffRole === 'Verifier' || staffRole === 'Support') ? (
                    <button onClick={() => setModal(item)} className='w-full mt-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:shadow-md transition cursor-pointer'>Verify</button>
                  ) : (
                    <div className='w-full mt-3 py-2 bg-gray-50 text-gray-400 text-xs font-medium rounded-xl text-center border border-gray-100'>No Verification Access</div>
                  )
                )}
              </div>
            ))}

          </div>
        </>
      )}

      {/* Modal */}
      {modal && (
        <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fade-in'>
            <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
              <h2 className='text-lg font-bold text-gray-800'>Quick Verify</h2>
              <button onClick={() => setModal(null)} className='text-gray-400 hover:text-gray-600 cursor-pointer'><X size={22} /></button>
            </div>
            <div className='p-5 space-y-4'>
              <div className='grid grid-cols-2 gap-3 text-sm'>
                <div><p className='text-[11px] text-gray-400 font-bold uppercase'>Student</p><p className='font-semibold'>{modal.Student_Name}</p></div>
                <div><p className='text-[11px] text-gray-400 font-bold uppercase'>NED ID</p><p className='font-semibold'>{modal.NED_ID}</p></div>
                <div className='col-span-2'><p className='text-[11px] text-gray-400 font-bold uppercase'>Qualification</p><p className='font-semibold'>{modal.Degree_Name} ({modal.Qualification_Level})</p></div>
                <div><p className='text-[11px] text-gray-400 font-bold uppercase'>Certificate #</p><p className='font-semibold'>{modal.Certificate_Number}</p></div>
                <div><p className='text-[11px] text-gray-400 font-bold uppercase'>Grade</p><p className='font-semibold'>{modal.Grade || `${modal.Percentage}%`}</p></div>
              </div>
              <div className='bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800'>
                <AlertTriangle size={14} className='inline mr-1' />
                Confirm this record matches the physical documents.
              </div>
              <div className='flex gap-3 justify-end'>
                <button onClick={() => handleVerify(modal.Qualification_ID, 'Rejected')} disabled={actionLoading} className='px-4 py-2.5 border border-red-300 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition disabled:opacity-50 cursor-pointer'>
                  Reject
                </button>
                <button 
                  onClick={() => handleVerify(modal.Qualification_ID, 'Verified')} 
                  disabled={actionLoading || stats.status === 'Inactive'} 
                  className={`px-4 py-2.5 text-sm font-bold rounded-xl transition flex items-center gap-1 ${stats.status === 'Inactive' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-md cursor-pointer'}`}
                >
                  {actionLoading ? 'Processing...' : <><CheckCircle size={16} /> Mark Verified</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Notification Modal */}
      {notifModal && (
        <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fade-in'>
            <div className='px-5 py-4 border-b border-gray-100 flex justify-between items-center'>
              <h2 className='text-lg font-bold text-gray-800'>Broadcast to Staff</h2>
              <button onClick={() => setNotifModal(false)} className='text-gray-400 hover:text-gray-600 cursor-pointer'><X size={22} /></button>
            </div>
            <div className='p-5 space-y-4'>
              <div>
                <label className='block text-xs font-bold text-gray-400 uppercase mb-1'>Recipient Emails (comma separated)</label>
                <input 
                  type="text" 
                  value={notifTarget} 
                  onChange={(e) => setNotifTarget(e.target.value)}
                  placeholder="deo@inst.com, verifier@inst.com"
                  className='w-full px-4 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-500 transition'
                />
              </div>
              <div>
                <label className='block text-xs font-bold text-gray-400 uppercase mb-1'>Message</label>
                <textarea 
                  rows="4" 
                  value={notifMessage} 
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className='w-full px-4 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-500 transition resize-none'
                ></textarea>
              </div>
              <button 
                onClick={handleSendNotification}
                disabled={actionLoading || !notifMessage || !notifTarget}
                className='w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 cursor-pointer'
              >
                {actionLoading ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffDashboard
