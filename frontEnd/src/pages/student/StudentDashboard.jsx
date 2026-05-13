import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, AlertTriangle, FileText, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import { dataContext } from '../../context/UserContext.jsx'
import toast from 'react-hot-toast'

const StudentDashboard = () => {
  const navigate = useNavigate()
  const { userData } = useContext(dataContext)
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, pendingConsents: 0 })
  const [qualifications, setQualifications] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, qualsRes] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/student/qualifications')
        ])
        setStats(dashRes.data.stats)
        setActivity(dashRes.data.activity || [])
        setQualifications(qualsRes.data.qualifications || [])
      } catch (error) {
        toast.error('Failed to load dashboard data')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getStatusBadge = (status) => {
    if (status === 'Verified') return <span className='px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1'><CheckCircle size={11} /> Verified</span>
    if (status === 'Pending') return <span className='px-2.5 py-1 text-[11px] font-bold bg-amber-100 text-amber-700 rounded-full flex items-center gap-1'><Clock size={11} /> Pending</span>
    return <span className='px-2.5 py-1 text-[11px] font-bold bg-red-100 text-red-700 rounded-full flex items-center gap-1'><AlertTriangle size={11} /> Rejected</span>
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
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
      <div className='mb-6'>
        <h1 className='text-xl sm:text-2xl font-bold text-gray-800'>Student Dashboard</h1>
        <p className='text-sm text-gray-400 mt-0.5'>Welcome back, {userData?.name}! Here's your qualification overview.</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6'>
        {[
          { label: 'Total Qualifications', value: stats.total || 0, color: 'from-blue-500 to-indigo-500', icon: <FileText size={20} /> },
          { label: 'Verified', value: stats.verified || 0, color: 'from-emerald-500 to-teal-500', icon: <CheckCircle size={20} /> },
          { label: 'Pending Consents', value: stats.pendingConsents || 0, color: 'from-amber-500 to-orange-500', icon: <Clock size={20} /> },
        ].map((s, i) => (
          <div key={i} className='bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300 group'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-gray-400 font-medium'>{s.label}</p>
                <p className='text-3xl font-extrabold text-gray-800 mt-1'>{s.value}</p>
              </div>
              <div className={`w-11 h-11 bg-gradient-to-br ${s.color} text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Qualifications List */}
      <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
        <div className='px-5 py-4 border-b border-gray-100 flex items-center justify-between'>
          <h2 className='text-base font-bold text-gray-800'>My Qualifications</h2>
          <button onClick={() => navigate('/student/verifications')} className='text-sm text-blue-600 font-semibold hover:underline cursor-pointer flex items-center gap-1'>
            View Requests <ChevronRight size={14} />
          </button>
        </div>

        {qualifications.length === 0 ? (
          <div className='px-5 py-10 text-center text-gray-400 text-sm'>No qualifications found. Your institution will add your records here.</div>
        ) : (
          <div className='divide-y divide-gray-50'>
            {qualifications.map(qual => (
              <div key={qual.Qualification_ID} className='px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between hover:bg-blue-50/30 transition cursor-pointer' onClick={() => navigate(`/student/qualifications/${qual.Qualification_ID}`)}>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0'>
                    <FileText size={18} />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-sm font-bold text-gray-800 truncate'>{qual.Degree_Name}</p>
                    <p className='text-xs text-gray-400'>{qual.Institution_Name} • {qual.Completion_Date ? new Date(qual.Completion_Date).getFullYear() : ''} • {qual.Grade || `${qual.Percentage}%`}</p>
                  </div>
                </div>
                <div className='flex items-center gap-3 ml-13 sm:ml-0'>
                  {getStatusBadge(qual.Status)}
                  <ChevronRight size={14} className='text-gray-300 hidden sm:block' />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className='bg-white rounded-2xl border border-gray-200 mt-6 overflow-hidden'>
        <div className='px-5 py-4 border-b border-gray-100'>
          <h2 className='text-base font-bold text-gray-800'>Recent Activity</h2>
        </div>
        <div className='divide-y divide-gray-50'>
          {activity.length === 0 ? (
            <div className='px-5 py-6 text-center text-gray-400 text-sm'>No recent activity.</div>
          ) : (
            activity.map((a, i) => (
              <div key={i} className='px-5 py-3.5 flex items-center gap-3'>
                <div className={`w-2 h-2 ${a.Action_Type === 'UPDATE' ? 'bg-emerald-500' : a.Action_Type === 'CREATE' ? 'bg-blue-500' : 'bg-amber-500'} rounded-full shrink-0`}></div>
                <p className='text-sm text-gray-600 flex-1 min-w-0'>{a.Action_Type} on {a.Table_Name} {a.New_Value ? `— ${a.New_Value}` : ''}</p>
                <span className='text-[11px] text-gray-400 shrink-0'>{formatDate(a.Timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
