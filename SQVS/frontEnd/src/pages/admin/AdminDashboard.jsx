import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, AlertTriangle, FileCheck, TrendingUp, ChevronRight, ShieldCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ activeInstitutions: 0, pendingApprovals: 0, pendingVerifiers: 0, totalVerifications: 0, completed: 0 })
  const [weeklyData, setWeeklyData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [topInstitutions, setTopInstitutions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/admin/dashboard')
        setStats(data.stats)
        setWeeklyData(data.weeklyData || [])
        setAlerts(data.alerts || [])
        setTopInstitutions(data.topInstitutions || [])
      } catch (error) {
        toast.error('Failed to load dashboard data')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
          <h1 className='text-2xl font-bold text-gray-800'>Ministry Executive Dashboard</h1>
          <p className='text-sm text-gray-500'>System Overview & Key Performance Indicators</p>
        </div>
        <button onClick={() => navigate('/admin/analytics')} className='px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition cursor-pointer'>Full Analytics</button>
      </div>

      {/* KPIs */}
      <div className='grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6'>
        <div className='bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3'>
          <div className='w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center'><Building size={20} /></div>
          <div><p className='text-xl font-bold text-gray-800'>{stats.activeInstitutions}</p><p className='text-[10px] text-gray-500 font-bold uppercase tracking-tight'>Institutions</p></div>
        </div>
        
        <div className='bg-white rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition' onClick={() => navigate('/admin/institutions/pending')}>
          <div className='w-10 h-10 bg-yellow-500 text-white rounded-lg flex items-center justify-center'><AlertTriangle size={20} /></div>
          <div><p className='text-xl font-bold text-yellow-700'>{stats.pendingApprovals}</p><p className='text-[10px] text-yellow-700 font-bold uppercase tracking-tight'>Pending Inst.</p></div>
        </div>

        <div className='bg-white rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition' onClick={() => navigate('/admin/verifiers/pending')}>
          <div className='w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center'><ShieldCheck size={20} /></div>
          <div><p className='text-xl font-bold text-indigo-700'>{stats.pendingVerifiers}</p><p className='text-[10px] text-indigo-700 font-bold uppercase tracking-tight'>Pending Ver.</p></div>
        </div>

        <div className='bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3'>
          <div className='w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center'><FileCheck size={20} /></div>
          <div><p className='text-xl font-bold text-gray-800'>{stats.totalVerifications}</p><p className='text-[10px] text-gray-500 font-bold uppercase tracking-tight'>Total Req.</p></div>
        </div>

        <div className='bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3'>
          <div className='w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center'><TrendingUp size={20} /></div>
          <div><p className='text-xl font-bold text-gray-800'>{stats.completed}</p><p className='text-[10px] text-gray-500 font-bold uppercase tracking-tight'>Completed</p></div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
        {/* Chart */}
        <div className='lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5'>
          <h2 className='text-base font-semibold text-gray-800 mb-4'>Verification Volume (Last 7 Days)</h2>
          <div className='h-[300px] w-full'>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="reqs" name="Requests" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex items-center justify-center h-full text-gray-400 text-sm'>No data for the past week</div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className='bg-white rounded-xl border border-gray-200 p-5'>
          <h2 className='text-base font-semibold text-gray-800 mb-4'>Recent Activity</h2>
          {alerts.length === 0 ? (
            <div className='text-center text-gray-400 text-sm py-4'>No recent activity</div>
          ) : (
            <div className='space-y-3'>
              {alerts.map(a => (
                <div key={a.Log_ID} className='p-3 rounded-lg border bg-gray-50 border-gray-200 text-sm'>
                  <div className='flex justify-between mb-1'>
                    <span className='text-xs font-semibold text-blue-700'>{a.Action_Type}</span>
                    <span className='text-xs text-gray-400'>{formatDate(a.Timestamp)}</span>
                  </div>
                  <p className='text-gray-700'>{a.User_Email} — {a.Table_Name} {a.New_Value ? `(${a.New_Value})` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Institutions Table */}
      <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
        <div className='px-5 py-4 border-b border-gray-200 flex justify-between items-center'>
          <h2 className='text-base font-semibold text-gray-800'>Top Processing Institutions</h2>
        </div>
        {topInstitutions.length === 0 ? (
          <div className='px-5 py-6 text-center text-gray-400 text-sm'>No institution data available</div>
        ) : (
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='text-left text-xs font-semibold text-gray-500 px-5 py-3'>Institution</th>
                <th className='text-left text-xs font-semibold text-gray-500 px-5 py-3'>Location</th>
                <th className='text-left text-xs font-semibold text-gray-500 px-5 py-3'>Verifications</th>
                <th className='text-left text-xs font-semibold text-gray-500 px-5 py-3'>Avg Days</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {topInstitutions.map((inst, i) => (
                <tr key={i} className='hover:bg-gray-50'>
                  <td className='px-5 py-3 text-sm font-medium text-gray-800'>{inst.Institution_Name}</td>
                  <td className='px-5 py-3 text-sm text-gray-600'>{inst.Location}</td>
                  <td className='px-5 py-3 text-sm text-gray-600'>{inst.verifications}</td>
                  <td className='px-5 py-3 text-sm text-gray-600'>{inst.avgDays || '—'} Days</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
