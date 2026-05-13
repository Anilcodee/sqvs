import React, { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../../services/api'
import toast from 'react-hot-toast'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#9ca3af']

const Analytics = () => {
  const [trends, setTrends] = useState([])
  const [purposeDistribution, setPurposeDistribution] = useState([])
  const [revenue, setRevenue] = useState({ totalRevenue: 0, totalTxns: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/admin/analytics')
        setTrends(data.trends || [])
        setPurposeDistribution(data.purposeDistribution || [])
        setRevenue(data.revenue || { totalRevenue: 0, totalTxns: 0 })
      } catch (error) {
        toast.error('Failed to load analytics data')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/admin/analytics/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'SQVS-Analytics-Report.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      toast.error('Failed to export analytics report')
      console.error(error)
    }
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Analytics & Reports</h1>
          <p className='text-sm text-gray-500'>System-wide data visualizations</p>
        </div>
        <button onClick={handleExportExcel} className='px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-2 cursor-pointer shadow-sm'>
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
        {/* Area Chart */}
        <div className='lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5'>
          <h2 className='text-base font-semibold text-gray-800 mb-4'>Verification Trends by Purpose</h2>
          <div className='h-[350px] w-full'>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="cEmp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                    <linearGradient id="cEdu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient>
                    <linearGradient id="cVisa" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="emp" name="Employment" stroke="#2563eb" fillOpacity={1} fill="url(#cEmp)" />
                  <Area type="monotone" dataKey="edu" name="Education" stroke="#16a34a" fillOpacity={1} fill="url(#cEdu)" />
                  <Area type="monotone" dataKey="visa" name="Visa" stroke="#f59e0b" fillOpacity={1} fill="url(#cVisa)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex items-center justify-center h-full text-gray-400 text-sm'>No trend data available</div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className='bg-white rounded-xl border border-gray-200 p-5'>
          <h2 className='text-base font-semibold text-gray-800 mb-1'>Purpose Distribution</h2>
          <p className='text-sm text-gray-500 mb-4'>Breakdown of access requests</p>
          <div className='h-[280px] w-full'>
            {purposeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={purposeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {purposeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex items-center justify-center h-full text-gray-400 text-sm'>No distribution data</div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-white rounded-xl border border-gray-200 p-6'>
          <h3 className='text-lg font-bold text-gray-800'>₹{(revenue.totalRevenue || 0).toLocaleString('en-IN')}</h3>
          <p className='text-sm text-gray-500 font-semibold mb-3'>Total Revenue Collected</p>
          <p className='text-xs text-gray-500 mb-4'>Total amount received from completed payment transactions.</p>
          <div className='flex justify-between text-xs font-semibold mb-1'>
            <span>Total Transactions</span>
            <span className='text-blue-600'>{revenue.totalTxns || 0}</span>
          </div>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-6'>
          <h3 className='text-lg font-bold text-gray-800'>{purposeDistribution.length}</h3>
          <p className='text-sm text-gray-500 font-semibold mb-3'>Purpose Categories</p>
          <p className='text-xs text-gray-500 mb-4'>Number of unique verification purpose categories being tracked.</p>
          <div className='space-y-1'>
            {purposeDistribution.map((item, i) => (
              <div key={i} className='flex justify-between text-xs'>
                <span className='text-gray-600'>{item.name}</span>
                <span className='font-semibold text-gray-800'>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
