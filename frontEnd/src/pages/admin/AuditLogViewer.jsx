import React, { useState, useEffect, useCallback } from 'react'
import { Search, Download, Filter, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const AuditLogViewer = () => {
  const [search, setSearch] = useState('')
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState({ key: 'Timestamp', direction: 'DESC' })
  const limit = 20

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/audit-logs', {
        params: { page, limit, search, sortBy: sortConfig.key, sortDir: sortConfig.direction }
      })
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (error) {
      toast.error('Failed to load audit logs')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [page, search, sortConfig])

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

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1) // reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const totalPages = Math.ceil(total / limit)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>System Audit Logs</h1>
          <p className='text-sm text-gray-500'>Comprehensive record of all system activities and transactions. Total: {total} entries</p>
        </div>
      </div>

      <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
        <div className='px-5 py-4 border-b border-gray-200 flex gap-3'>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search by user, action, or table...' className='flex-1 h-10 pl-4 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 transition' />
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-10'>
            <div className='w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
          </div>
        ) : logs.length === 0 ? (
          <div className='px-5 py-10 text-center text-gray-400 text-sm'>No audit logs found.</div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='text-left text-xs font-semibold text-gray-500 px-5 py-3 text-gray-400'>Log ID</th>
                    <th onClick={() => handleSort('Timestamp')} className='text-left text-xs font-semibold text-gray-500 px-5 py-3 cursor-pointer group'>
                      <div className="flex items-center gap-1">Timestamp {getSortIcon('Timestamp')}</div>
                    </th>
                    <th onClick={() => handleSort('User_Email')} className='text-left text-xs font-semibold text-gray-500 px-5 py-3 cursor-pointer group'>
                      <div className="flex items-center gap-1">User {getSortIcon('User_Email')}</div>
                    </th>
                    <th onClick={() => handleSort('Action_Type')} className='text-left text-xs font-semibold text-gray-500 px-5 py-3 cursor-pointer group'>
                      <div className="flex items-center gap-1">Action {getSortIcon('Action_Type')}</div>
                    </th>
                    <th onClick={() => handleSort('Table_Name')} className='text-left text-xs font-semibold text-gray-500 px-5 py-3 cursor-pointer group'>
                      <div className="flex items-center gap-1">Table {getSortIcon('Table_Name')}</div>
                    </th>
                    <th className='text-left text-xs font-semibold text-gray-500 px-5 py-3 text-gray-400'>Record ID</th>
                    <th className='text-left text-xs font-semibold text-gray-500 px-5 py-3 text-gray-400'>IP</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {logs.map(log => (
                    <tr key={log.Log_ID} className='hover:bg-gray-50'>
                      <td className='px-5 py-3 text-sm font-mono text-gray-500'>{log.Log_ID}</td>
                      <td className='px-5 py-3 text-sm text-gray-500 whitespace-nowrap'>{formatDate(log.Timestamp)}</td>
                      <td className='px-5 py-3 text-sm font-medium text-gray-800'>{log.User_Email}</td>
                      <td className='px-5 py-3'>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          log.Action_Type === 'CREATE' ? 'bg-green-100 text-green-700' :
                          log.Action_Type === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                          log.Action_Type === 'DELETE' ? 'bg-red-100 text-red-700' :
                          log.Action_Type === 'LOGIN' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{log.Action_Type}</span>
                      </td>
                      <td className='px-5 py-3 text-sm font-mono text-blue-600 font-medium'>{log.Table_Name}</td>
                      <td className='px-5 py-3 text-sm text-gray-500'>{log.Record_ID}</td>
                      <td className='px-5 py-3 text-xs text-gray-400'>{log.IP_Address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='px-5 py-4 border-t border-gray-200 flex items-center justify-between'>
                <p className='text-sm text-gray-500'>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
                </p>
                <div className='flex items-center gap-2'>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className='p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-30 cursor-pointer'>
                    <ChevronLeft size={16} />
                  </button>
                  <span className='text-sm font-medium text-gray-700'>Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className='p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-30 cursor-pointer'>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AuditLogViewer
