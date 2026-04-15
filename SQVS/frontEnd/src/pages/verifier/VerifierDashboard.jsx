import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Clock, CheckCircle, FileText, Download, ChevronRight, Search, ChevronUp, ChevronDown } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const VerifierDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, inProgress: 0 })
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'Request_Date', direction: 'DESC' })
  const requestCount = useRef(0)

  const fetchData = async (searchTerm = debouncedSearch) => {
    const currentRequestId = ++requestCount.current
    if (requests.length === 0) setLoading(true)
    else setSearching(true)
    
    try {
      const [dashRes, reqsRes] = await Promise.all([
        api.get('/verifier/dashboard'),
        api.get(`/verifier/requests?search=${searchTerm}&sortBy=${sortConfig.key}&sortDir=${sortConfig.direction}`)
      ])
      
      if (currentRequestId === requestCount.current) {
        setStats(dashRes.data.stats)
        setRequests(reqsRes.data.requests || [])
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

  const getStatusBadge = (status) => {
    if (status === 'Completed') return <span className='px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full'>{status}</span>
    if (status === 'Pending') return <span className='px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full'>{status}</span>
    return <span className='px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full'>{status?.replace('_', ' ')}</span>
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleDownloadCertificate = async (certNumber) => {
    try {
      const response = await api.get(`/public/certificates/${certNumber}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `SQVS-Certificate-${certNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      toast.error('Failed to download certificate')
      console.error(error)
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
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Verifier Dashboard</h1>
        <button onClick={() => navigate('/verifier/requests/new')} className='px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer'>
          <PlusCircle size={18} /> New Request
        </button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
        <div className='bg-white rounded-xl border border-gray-200 p-5'>
          <p className='text-sm text-gray-500'>Total Requests</p>
          <p className='text-3xl font-bold text-gray-800 mt-1'>{stats.total || 0}</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-5'>
          <p className='text-sm text-gray-500'>Pending / In Progress</p>
          <p className='text-3xl font-bold text-yellow-600 mt-1'>{(stats.pending || 0) + (stats.inProgress || 0)}</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-5'>
          <p className='text-sm text-gray-500'>Completed</p>
          <p className='text-3xl font-bold text-green-600 mt-1'>{stats.completed || 0}</p>
        </div>
      </div>
      {/* Search Bar */}
      <div className='mb-4'>
        <div className='relative'>
          <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searching ? 'text-blue-500' : 'text-gray-400'}`} />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder='Search by student name or certificate number...' 
            className='w-full h-11 pl-11 pr-12 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition bg-white' 
          />
          {searching && (
            <div className='absolute right-4 top-1/2 -translate-y-1/2'>
              <div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
            </div>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
        <div className='px-5 py-4 border-b border-gray-200'>
          <h2 className='text-base font-semibold text-gray-800'>Verification Requests</h2>
        </div>
        {requests.length === 0 ? (
          <div className='px-5 py-10 text-center text-gray-400 text-sm'>No requests yet. Create a new verification request to get started.</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th onClick={() => handleSort('Request_ID')} className='text-left text-xs font-semibold text-gray-500 px-5 py-3 cursor-pointer group whitespace-nowrap'>
                    <div className="flex items-center gap-1">Request ID {getSortIcon('Request_ID')}</div>
                  </th>
                  <th onClick={() => handleSort('Student_Name')} className='text-left text-xs font-semibold text-gray-500 px-5 py-3 cursor-pointer group whitespace-nowrap'>
                    <div className="flex items-center gap-1">Student {getSortIcon('Student_Name')}</div>
                  </th>
                  <th onClick={() => handleSort('Certificate_Number')} className='text-left text-xs font-semibold text-gray-500 px-5 py-3 cursor-pointer group whitespace-nowrap'>
                    <div className="flex items-center gap-1">Qualifications {getSortIcon('Certificate_Number')}</div>
                  </th>
                  <th onClick={() => handleSort('Amount')} className='text-left text-xs font-semibold text-gray-500 px-5 py-3 cursor-pointer group whitespace-nowrap'>
                    <div className="flex items-center gap-1">Amount {getSortIcon('Amount')}</div>
                  </th>
                  <th onClick={() => handleSort('Status')} className='text-left text-xs font-semibold text-gray-500 px-5 py-3 cursor-pointer group whitespace-nowrap'>
                    <div className="flex items-center gap-1">Status {getSortIcon('Status')}</div>
                  </th>
                  <th onClick={() => handleSort('Request_Date')} className='text-left text-xs font-semibold text-gray-500 px-5 py-3 cursor-pointer group whitespace-nowrap'>
                    <div className="flex items-center gap-1">Date {getSortIcon('Request_Date')}</div>
                  </th>
                  <th className='text-left text-xs font-semibold text-gray-500 px-5 py-3'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {requests.map(req => (
                  <tr key={req.Request_ID} className='hover:bg-gray-50'>
                    <td className='px-5 py-3 text-sm text-blue-600 font-mono font-medium'>REQ-{req.Request_ID}</td>
                    <td className='px-5 py-3 text-sm text-gray-800 font-medium'>{req.Student_Name}</td>
                    <td className='px-5 py-3 text-sm text-gray-600'>
                      {(req.qualifications || []).map(q => q.Degree_Name).join(', ') || '—'}
                    </td>
                    <td className='px-5 py-3 text-sm text-gray-600'>₹{req.Amount || '—'}</td>
                    <td className='px-5 py-3'>{getStatusBadge(req.Status)}</td>
                    <td className='px-5 py-3 text-sm text-gray-500'>
                      {formatDate(req.Request_Date)}
                    </td>
                    <td className='px-5 py-3 text-sm text-gray-500'>
                      <div className='flex items-center gap-2'>
                        <button onClick={() => navigate(`/verifier/requests/${req.Request_ID}`)} className='px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition cursor-pointer'>
                          View Details
                        </button>
                        {req.Status === 'Completed' && req.Certificate_Number && (
                          <button onClick={() => handleDownloadCertificate(req.Certificate_Number)} title="Download Certificate" className='p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition cursor-pointer'>
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifierDashboard
