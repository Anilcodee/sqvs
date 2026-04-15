import React, { useState, useContext, useEffect, useRef } from 'react'
import { Database, Play, RotateCcw, AlertCircle, CheckCircle2, Lock, ShieldAlert, Terminal as TermIcon } from 'lucide-react'
import axios from 'axios'
import { dataContext } from '../../context/UserContext'
import toast from 'react-hot-toast'

const TransactionDemo = () => {
  const { serverUrl } = useContext(dataContext)
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const logEndRef = useRef(null)

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  const addLog = (newLogs) => {
    setLogs(prev => [...prev, ...newLogs.map(text => ({ text, id: Date.now() + Math.random() }))])
  }

  const runExperiment = async (scenarioId) => {
    if (running) return
    setRunning(true)
    try {
      const res = await axios.post(`${serverUrl}/api/transactions/scenario/${scenarioId}`, {}, { withCredentials: true })
      if (res.data.logs) {
        addLog(res.data.logs)
      }
      if (res.data.success) {
        toast.success(`Scenario ${scenarioId} completed successfully`)
      } else if (res.data.expected) {
        toast.success(`Scenario ${scenarioId} rolled back safely as expected`)
      }
    } catch (error) {
      console.error('Experiment Error:', error)
      const errorLogs = error.response?.data?.logs || [`Error connecting to server: ${error.message}`]
      addLog(errorLogs)
      toast.error('Experiment encountered an error')
    } finally {
      setRunning(false)
    }
  }

  const resetDB = async () => {
    if (running) return
    setRunning(true)
    try {
      const res = await axios.post(`${serverUrl}/api/transactions/reset`, {}, { withCredentials: true })
      if (res.data.success) {
        setLogs([{ text: '--- Database Reset Successful ---', id: Date.now() }])
        toast.success('Database state restored to seed data')
      }
    } catch (error) {
      console.error('Reset DB Error:', error)
      toast.error('Failed to reset database')
    } finally {
      setRunning(false)
    }
  }

  const clearLogs = () => setLogs([])

  const scenarios = [
    { id: 1, title: 'COMMIT (Success)', desc: 'Inserts Request + Payment atomically.', icon: <CheckCircle2 className="text-green-500" /> },
    { id: 2, title: 'ROLLBACK (Failure)', desc: 'Valid Update + Invalid Insert = All Reversed.', icon: <AlertCircle className="text-red-500" /> },
    { id: 3, title: 'Row Locking', desc: 'Demo of blocking behavior between concurrent sessions.', icon: <Lock className="text-amber-500" /> },
    { id: 4, title: 'Deadlock', desc: 'Simulation of circular dependency resolution.', icon: <ShieldAlert className="text-purple-500" /> },
    { id: 5, title: 'Dirty Read', desc: 'Reading uncommitted data (READ UNCOMMITTED).', icon: <Database className="text-blue-500" /> },
  ]

  return (
    <div className='max-w-6xl mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-extrabold text-gray-900 tracking-tight'>Database Transaction Lab</h1>
          <p className='text-gray-500 mt-1'>Monitor and verify ACID properties and concurrency control in real-time.</p>
        </div>
        <div className='flex gap-3'>
          <button onClick={clearLogs} className='px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition'>Clear Console</button>
          <button 
            onClick={resetDB} 
            disabled={running}
            className='flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm disabled:opacity-50 cursor-pointer'>
            <RotateCcw size={18} /> Reset Environment
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Scenario Selection */}
        <div className='lg:col-span-1 space-y-4'>
          {scenarios.map((s) => (
            <div key={s.id} className='bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow'>
              <div className='flex items-start gap-4'>
                <div className='p-2.5 bg-gray-50 rounded-xl'>
                  {s.icon}
                </div>
                <div className='flex-1'>
                  <h3 className='font-bold text-gray-800'>{s.title}</h3>
                  <p className='text-xs text-gray-500 mt-1 leading-relaxed'>{s.desc}</p>
                </div>
              </div>
              <button 
                onClick={() => runExperiment(s.id)}
                disabled={running}
                className='mt-4 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:bg-blue-300 cursor-pointer'>
                <Play size={14} fill='currentColor' /> Run Laboratory
              </button>
            </div>
          ))}
        </div>

        {/* Console / Terminal */}
        <div className='lg:col-span-2 flex flex-col h-[600px]'>
          <div className='flex-1 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-800'>
            {/* Header */}
            <div className='px-6 py-4 bg-gray-800/50 flex items-center justify-between border-b border-gray-700'>
              <div className='flex items-center gap-3'>
                <div className='flex gap-1.5'>
                  <div className='w-3 h-3 bg-red-400 rounded-full'></div>
                  <div className='w-3 h-3 bg-amber-400 rounded-full'></div>
                  <div className='w-3 h-3 bg-emerald-400 rounded-full'></div>
                </div>
                <div className='h-4 w-px bg-gray-700 mx-2'></div>
                <div className='flex items-center gap-2 text-gray-400 text-xs font-mono semibold'>
                  <TermIcon size={14} />
                  <span>EXPERIMENTAL_SHELL_LOGS.EXE</span>
                </div>
              </div>
              {running && (
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full animate-ping'></div>
                  <span className='text-[10px] text-blue-400 font-bold uppercase tracking-widest'>Executing...</span>
                </div>
              )}
            </div>

            {/* Output */}
            <div className='flex-1 overflow-y-auto p-6 font-mono text-sm custom-scrollbar'>
              {logs.length === 0 ? (
                <div className='h-full flex flex-col items-center justify-center text-gray-600 opacity-50'>
                   <Database size={48} className='mb-4' />
                   <p>System idle. Select a scenario to begin execution.</p>
                </div>
              ) : (
                <div className='space-y-1.5'>
                  {logs.map((log) => {
                    let color = 'text-gray-300'
                    if (log.text.includes('---')) color = 'text-blue-400 font-bold mt-4'
                    else if (log.text.includes('Error') || log.text.includes('FAIL')) color = 'text-red-400'
                    else if (log.text.includes('rolled back')) color = 'text-amber-400 font-semibold'
                    else if (log.text.includes('successfully') || log.text.includes('committed')) color = 'text-emerald-400 font-semibold'
                    else if (log.text.includes('Connection')) color = 'text-indigo-300'
                    
                    return (
                      <div key={log.id} className={`${color} leading-relaxed flex gap-3`}>
                        <span className='opacity-30 select-none'>$</span>
                        <span>{log.text}</span>
                      </div>
                    )
                  })}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className='px-6 py-3 bg-gray-800/30 border-t border-gray-700 flex items-center justify-between'>
              <div className='flex items-center gap-4 text-[10px] text-gray-500 font-medium uppercase tracking-tighter'>
                <span>Database: SQVS_V3</span>
                <span>Port: 3306</span>
                <span>Protocol: TCP/IP</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-1.5 h-1.5 bg-emerald-500 rounded-full'></div>
                <span className='text-[10px] text-gray-500 font-bold'>ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionDemo
