import React, { useState, useContext, useEffect, useRef } from 'react'
import { Database, Play, RotateCcw, AlertCircle, CheckCircle2, Lock, ShieldAlert, Terminal as TermIcon, Eye, Info, ChevronDown, ChevronRight } from 'lucide-react'
import axios from 'axios'
import { dataContext } from '../../context/UserContext'
import toast from 'react-hot-toast'

const THEORY = {
  1: {
    title: 'COMMIT — Atomic Success',
    desc: 'All SQL operations in a transaction succeed together or not at all. This scenario inserts a Verification Request AND its Payment record atomically.',
    sql: 'START TRANSACTION;\nINSERT INTO VERIFICATION_REQUEST (...);\nINSERT INTO PAYMENT_TRANSACTION (...);\nCOMMIT;'
  },
  2: {
    title: 'ROLLBACK — Failure Recovery',
    desc: 'When one operation fails (duplicate certificate), the entire transaction is rolled back — the earlier UPDATE is reversed automatically.',
    sql: 'START TRANSACTION;\nUPDATE ... SET Status = "Completed";\nINSERT ... (duplicate key → ERROR);\nROLLBACK;'
  },
  3: {
    title: 'Row-Level Locking',
    desc: 'SELECT ... FOR UPDATE acquires an exclusive lock on the row. Session B is blocked (waiting) until Session A releases the lock by committing.',
    sql: 'Session A: SELECT * FROM ... WHERE id=17 FOR UPDATE;\nSession B: SELECT * FROM ... WHERE id=17 FOR UPDATE;\n-- B waits for A to commit'
  },
  4: {
    title: 'Deadlock Detection',
    desc: 'A circular lock dependency: A locks row #19, B locks row #20, then both try for the other\'s row. MySQL detects this and rolls back one transaction.',
    sql: 'A: Lock Row #19 → Try Row #20 (wait)\nB: Lock Row #20 → Try Row #19 (DEADLOCK!)\nMySQL auto-resolves by rolling back one.'
  },
  5: {
    title: 'Dirty Read (READ UNCOMMITTED)',
    desc: 'Session B reads data that Session A has modified but NOT committed. When A rolls back, B has "dirty" data that never existed.',
    sql: 'A: UPDATE payment SET status="Completed"; -- NOT committed\nB: SET ISOLATION READ UNCOMMITTED;\nB: SELECT status; → "Completed" ← DIRTY!\nA: ROLLBACK; -- data never existed'
  },
  6: {
    title: 'Non-Repeatable Read (READ COMMITTED)',
    desc: 'Session B reads the same row twice within a single transaction. Between the reads, Session A commits a change. B sees two different values — a non-repeatable read.',
    sql: 'B: READ request #5 → "Pending"\nA: UPDATE #5 to "In_Progress"; COMMIT;\nB: READ request #5 → "In_Progress" ← CHANGED!\nSame transaction, different values.'
  }
}

const TransactionDemo = () => {
  const { serverUrl } = useContext(dataContext)
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(new Set())
  const [activeTheory, setActiveTheory] = useState(null)
  const logEndRef = useRef(null)

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  const addLog = (newLogs) => {
    // Typewriter: add logs one by one with delay
    newLogs.forEach((text, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, { text, id: Date.now() + Math.random(), fresh: true }])
      }, i * 120)
    })
  }

  const runExperiment = async (scenarioId) => {
    if (running) return
    setRunning(true)
    setActiveTheory(null)
    try {
      const res = await axios.post(`${serverUrl}/api/transactions/scenario/${scenarioId}`, {}, { withCredentials: true })
      if (res.data.logs) {
        addLog(res.data.logs)
      }
      setCompleted(prev => new Set([...prev, scenarioId]))
      if (res.data.success) {
        toast.success(`Scenario ${scenarioId} completed successfully`)
      } else if (res.data.expected) {
        toast.success(`Scenario ${scenarioId} demonstrated expected behavior`)
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
        setLogs([{ text: '--- Database Reset Successful — All tables restored to seed data ---', id: Date.now() }])
        setCompleted(new Set())
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
    { id: 1, title: 'COMMIT (Success)', desc: 'Inserts Request + Payment atomically.', icon: <CheckCircle2 className="text-emerald-500" size={20} />, color: 'border-emerald-200 bg-emerald-50/50' },
    { id: 2, title: 'ROLLBACK (Failure)', desc: 'Valid Update + Invalid Insert = All Reversed.', icon: <AlertCircle className="text-red-500" size={20} />, color: 'border-red-200 bg-red-50/50' },
    { id: 3, title: 'Row Locking', desc: 'Blocking behavior between concurrent sessions.', icon: <Lock className="text-amber-500" size={20} />, color: 'border-amber-200 bg-amber-50/50' },
    { id: 4, title: 'Deadlock', desc: 'Circular dependency resolution by MySQL.', icon: <ShieldAlert className="text-purple-500" size={20} />, color: 'border-purple-200 bg-purple-50/50' },
    { id: 5, title: 'Dirty Read', desc: 'Reading uncommitted data (READ UNCOMMITTED).', icon: <Database className="text-blue-500" size={20} />, color: 'border-blue-200 bg-blue-50/50' },
    { id: 6, title: 'Non-Repeatable Read', desc: 'Data changes mid-transaction (READ COMMITTED).', icon: <Eye className="text-cyan-500" size={20} />, color: 'border-cyan-200 bg-cyan-50/50' },
  ]

  const getLogColor = (text) => {
    if (text.includes('---')) return 'text-blue-400 font-bold'
    if (text.includes('Error') || text.includes('FAIL') || text.includes('Deadlock') || text.includes('DEADLOCK')) return 'text-red-400'
    if (text.includes('rolled back') || text.includes('ROLLBACK') || text.includes('Rolled back')) return 'text-amber-400 font-semibold'
    if (text.includes('successfully') || text.includes('committed') || text.includes('COMMITTED') || text.includes('Success')) return 'text-emerald-400 font-semibold'
    if (text.includes('Connection') || text.includes('Session') || text.includes('session')) return 'text-indigo-300'
    if (text.includes('DIRTY') || text.includes('NON-REPEATABLE') || text.includes('anomaly')) return 'text-rose-400 font-bold'
    if (text.includes('SELECT') || text.includes('UPDATE') || text.includes('INSERT') || text.includes('SET')) return 'text-cyan-300'
    if (text.includes('Result:') || text.includes('demonstrates')) return 'text-yellow-300 font-semibold'
    if (text.includes('Cleanup')) return 'text-gray-500 italic'
    return 'text-gray-300'
  }

  return (
    <div className='max-w-7xl mx-auto'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4'>
        <div>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center'>
              <Database size={20} className='text-white' />
            </div>
            <div>
              <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight'>Database Transaction Lab</h1>
              <p className='text-gray-500 text-sm mt-0.5'>ACID properties & concurrency control — 6 live scenarios</p>
            </div>
          </div>
        </div>
        <div className='flex gap-3'>
          <button onClick={clearLogs} className='px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition rounded-lg hover:bg-gray-100'>Clear Console</button>
          <button
            onClick={resetDB}
            disabled={running}
            className='flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm disabled:opacity-50 cursor-pointer'>
            <RotateCcw size={16} /> Reset DB
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className='bg-white rounded-xl border border-gray-200 p-4 mb-6'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Scenario Progress</span>
          <span className='text-xs font-bold text-blue-600'>{completed.size}/6 complete</span>
        </div>
        <div className='flex gap-1.5'>
          {scenarios.map(s => (
            <div key={s.id} className={`flex-1 h-2 rounded-full transition-all duration-500 ${completed.has(s.id) ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Scenario Selection */}
        <div className='lg:col-span-1 space-y-3'>
          {scenarios.map((s) => (
            <div key={s.id} className={`bg-white rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden ${completed.has(s.id) ? 'border-gray-200 opacity-80' : 'border-gray-100 hover:shadow-md hover:-translate-y-0.5'}`}>
              <div className='p-4'>
                <div className='flex items-start gap-3'>
                  <div className={`p-2 rounded-xl border ${s.color}`}>
                    {s.icon}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-bold text-gray-800 text-sm'>{s.title}</h3>
                      {completed.has(s.id) && <CheckCircle2 size={14} className='text-emerald-500 shrink-0' />}
                    </div>
                    <p className='text-[11px] text-gray-500 mt-0.5 leading-relaxed'>{s.desc}</p>
                  </div>
                </div>
                <div className='flex gap-2 mt-3'>
                  <button
                    onClick={() => setActiveTheory(activeTheory === s.id ? null : s.id)}
                    className='flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer'>
                    <Info size={12} /> Theory
                    {activeTheory === s.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  <button
                    onClick={() => runExperiment(s.id)}
                    disabled={running}
                    className='flex-[2] flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-blue-500/25 transition disabled:from-blue-300 disabled:to-indigo-300 cursor-pointer'>
                    <Play size={12} fill='currentColor' /> Execute
                  </button>
                </div>
              </div>

              {/* Theory Expandable */}
              {activeTheory === s.id && THEORY[s.id] && (
                <div className='px-4 pb-4 animate-fade-in'>
                  <div className='bg-gray-50 rounded-xl p-3 border border-gray-100'>
                    <h4 className='text-xs font-bold text-gray-700 mb-1'>{THEORY[s.id].title}</h4>
                    <p className='text-[11px] text-gray-500 leading-relaxed mb-2'>{THEORY[s.id].desc}</p>
                    <pre className='text-[10px] bg-gray-900 text-emerald-400 p-2.5 rounded-lg overflow-x-auto font-mono leading-relaxed'>{THEORY[s.id].sql}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Console / Terminal */}
        <div className='lg:col-span-2 flex flex-col h-[700px]'>
          <div className='flex-1 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-800'>
            {/* Header */}
            <div className='px-6 py-4 bg-gray-800/60 flex items-center justify-between border-b border-gray-700/50'>
              <div className='flex items-center gap-3'>
                <div className='flex gap-1.5'>
                  <div className='w-3 h-3 bg-red-400 rounded-full hover:bg-red-300 transition'></div>
                  <div className='w-3 h-3 bg-amber-400 rounded-full hover:bg-amber-300 transition'></div>
                  <div className='w-3 h-3 bg-emerald-400 rounded-full hover:bg-emerald-300 transition'></div>
                </div>
                <div className='h-4 w-px bg-gray-700 mx-1'></div>
                <div className='flex items-center gap-2 text-gray-400 text-xs font-mono'>
                  <TermIcon size={14} />
                  <span>SQVS_TRANSACTION_LAB</span>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                {running && (
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full animate-ping'></div>
                    <span className='text-[10px] text-blue-400 font-bold uppercase tracking-widest'>Executing...</span>
                  </div>
                )}
                <span className='text-[10px] text-gray-600 font-mono'>{logs.length} lines</span>
              </div>
            </div>

            {/* Output */}
            <div className='flex-1 overflow-y-auto p-6 font-mono text-sm custom-scrollbar'>
              {logs.length === 0 ? (
                <div className='h-full flex flex-col items-center justify-center text-gray-600'>
                  <Database size={52} className='mb-4 opacity-20' />
                  <p className='text-sm opacity-60 text-center'>System idle. Select a scenario and click Execute.</p>
                  <p className='text-xs opacity-30 mt-2'>Each scenario demonstrates a different ACID / concurrency concept.</p>
                </div>
              ) : (
                <div className='space-y-1'>
                  {logs.map((log, i) => (
                    <div 
                      key={log.id} 
                      className={`${getLogColor(log.text)} leading-relaxed flex gap-3 animate-type-in`}
                      style={{ animationDelay: `${i * 0.02}s` }}
                    >
                      <span className='opacity-20 select-none text-gray-500 text-xs mt-0.5 w-4 text-right shrink-0'>{i + 1}</span>
                      <span className='opacity-30 select-none'>$</span>
                      <span>{log.text}</span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className='px-6 py-3 bg-gray-800/30 border-t border-gray-700/50 flex items-center justify-between'>
              <div className='flex items-center gap-4 text-[10px] text-gray-500 font-mono'>
                <span>Database: SQVS</span>
                <span>Engine: InnoDB</span>
                <span>Port: 3306</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-1.5 h-1.5 bg-emerald-500 rounded-full relative'>
                  <div className='absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-50'></div>
                </div>
                <span className='text-[10px] text-emerald-500 font-bold'>CONNECTED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionDemo
