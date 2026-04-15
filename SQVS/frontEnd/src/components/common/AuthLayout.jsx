import React, { useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { dataContext } from '../../context/UserContext.jsx'
import { Home, LogOut, Menu, X, Bell, ShieldCheck, BarChart2, ClipboardList, PlusCircle, ScrollText, ChevronRight, AlertTriangle, Users, Building } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthLayout = ({ children }) => {
  const { userData, setUserData, serverUrl, loading } = useContext(dataContext)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await axios.post(serverUrl + '/api/auth/logout', {}, { withCredentials: true })
    } catch (err) {
      console.error('Logout error:', err)
    }
    setUserData(null)
    localStorage.removeItem('sqvs_user')
    toast.success('Logged out')
    navigate('/login')
  }

  const fetchNotifications = useCallback(async () => {
    try {
      if (!userData) return
      const res = await axios.get(serverUrl + '/api/notifications', { withCredentials: true })
      if (res.data.success) {
        setNotifications(res.data.notifications)
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    }
  }, [userData, serverUrl])

  useEffect(() => {
    if (!loading && !userData) {
      navigate('/login')
    }
  }, [userData, navigate, loading])

  useEffect(() => {
    if (userData) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 60000) // Poll every 1 min
      return () => clearInterval(interval)
    }
  }, [userData, fetchNotifications])

  const markRead = async (id) => {
    try {
      await axios.put(serverUrl + `/api/notifications/${id}/read`, {}, { withCredentials: true })
      setNotifications(notifications.map(n => n.Notification_ID === id ? { ...n, Read_Status: 1 } : n))
    } catch (err) {
      console.error('Mark read error:', err)
    }
  }

  const markAllRead = async () => {
    try {
      await axios.put(serverUrl + '/api/notifications/read-all', {}, { withCredentials: true })
      setNotifications(notifications.map(n => ({ ...n, Read_Status: 1 })))
    } catch (err) {
      console.error('Mark all read error:', err)
    }
  }

  const deleteNotif = async (e, id) => {
    e.stopPropagation()
    try {
      await axios.delete(serverUrl + `/api/notifications/${id}`, { withCredentials: true })
      setNotifications(notifications.filter(n => n.Notification_ID !== id))
    } catch (err) {
      console.error('Delete notification error:', err)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50'>
        <div className='w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  if (!userData) return null

  const isAdmin = location.pathname.startsWith('/admin')
  const isStaff = location.pathname.startsWith('/staff')
  const isVerifier = location.pathname.startsWith('/verifier')

  let menuItems = [
    { text: 'Dashboard', icon: <Home size={18} />, path: '/student/dashboard' },
    { text: 'My Verifications', icon: <ClipboardList size={18} />, path: '/student/verifications' },
    { text: 'Error Reports', icon: <AlertTriangle size={18} />, path: '/student/error-reports' },
  ]
  if (isStaff) {
    const staffRole = userData?.staffRole
    menuItems = [
      { text: 'Workqueue', icon: <Home size={18} />, path: '/staff/dashboard' },
    ]
    if (staffRole === 'Data_Entry_Operator' || staffRole === 'Support') {
      menuItems.push({ text: 'Add Qualification', icon: <PlusCircle size={18} />, path: '/staff/qualifications/new' })
    }
    if (staffRole === 'Administrator') {
      menuItems.push({ text: 'Manage Staff', icon: <Users size={18} />, path: '/staff/members' })
    }
  } else if (isVerifier) {
    menuItems = [
      { text: 'Dashboard', icon: <Home size={18} />, path: '/verifier/dashboard' },
      { text: 'New Request', icon: <PlusCircle size={18} />, path: '/verifier/requests/new' },
    ]
  } else if (isAdmin) {
    menuItems = [
      { text: 'Dashboard', icon: <Home size={18} />, path: '/admin/dashboard' },
      { text: 'Institution Approvals', icon: <Building size={18} />, path: '/admin/institutions/pending' },
      { text: 'Verifier Approvals', icon: <ShieldCheck size={18} />, path: '/admin/verifiers/pending' },
      { text: 'Analytics', icon: <BarChart2 size={18} />, path: '/admin/analytics' },
      { text: 'Audit Logs', icon: <ScrollText size={18} />, path: '/admin/logs' },
    ]
  }

  const roleColor = isAdmin ? 'from-purple-600 to-indigo-700' : isStaff ? 'from-emerald-600 to-teal-700' : isVerifier ? 'from-amber-600 to-orange-600' : 'from-blue-600 to-indigo-600'
  const roleLabel = isAdmin ? 'Admin Portal' : isStaff ? 'Staff Portal' : isVerifier ? 'Verifier Portal' : 'Student Portal'

  const unreadCount = notifications.filter(n => !n.Read_Status).length

  return (
    <div className='flex h-screen bg-gray-50 overflow-hidden'>
      {/* Sidebar */}
      <aside className={`fixed z-30 inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static h-full shadow-xl md:shadow-none`}>
        {/* Logo */}
        <div className='flex items-center gap-2.5 px-5 py-5 border-b border-gray-100'>
          <div className={`w-9 h-9 bg-gradient-to-br ${roleColor} rounded-lg flex items-center justify-center`}>
            <ShieldCheck className='text-white' size={20} />
          </div>
          <div>
            <span className='text-lg font-bold text-gray-800 block leading-tight'>SQVS</span>
            <span className='text-[10px] font-semibold text-gray-400 uppercase tracking-widest'>{roleLabel}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className='flex-1 px-3 py-5 space-y-1 overflow-y-auto custom-scrollbar'>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link key={item.text} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? `bg-gradient-to-r ${roleColor} text-white shadow-md` : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                {item.icon}
                <span>{item.text}</span>
                {isActive && <ChevronRight size={14} className='ml-auto opacity-70' />}
              </Link>
            )
          })}
        </nav>

        {/* User info + Logout */}
        <div className='px-3 py-4 border-t border-gray-100 mt-auto bg-white'>
          <div className='flex items-center gap-3 px-3 py-2 mb-2'>
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColor} text-white flex items-center justify-center text-sm font-bold shadow-md`}>
              {userData.name?.charAt(0)}
            </div>
            <div className='min-w-0'>
              <p className='text-sm font-semibold text-gray-800 truncate'>{userData.name}</p>
              <p className='text-[11px] text-gray-400 truncate'>{userData.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className='flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 w-full transition cursor-pointer'>
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className='fixed inset-0 bg-black/40 z-20 md:hidden' onClick={() => setSidebarOpen(false)}></div>}

      {/* Main */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* TopBar */}
        <header className='w-full bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between md:px-6 sticky top-0 z-10'>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className='md:hidden text-gray-600 cursor-pointer'>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className='flex-1'></div>
          <div className='flex items-center gap-3'>
            <div className='relative'>
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className='relative text-gray-400 hover:text-gray-600 transition cursor-pointer p-2 rounded-full hover:bg-gray-100'>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className='absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center animate-pulse-ring'>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <>
                  <div className='fixed inset-0 z-10' onClick={() => setNotifOpen(false)}></div>
                  <div className='absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden transform origin-top-right transition-all'>
                    <div className='px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50'>
                      <span className='font-bold text-gray-800'>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className='text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline-offset-2 hover:underline'>
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className='max-h-[400px] overflow-y-auto'>
                      {notifications.length === 0 ? (
                        <div className='py-12 flex flex-col items-center text-gray-400'>
                          <Bell size={40} strokeWidth={1} className='mb-2 opacity-20' />
                          <p className='text-sm'>All caught up!</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.Notification_ID} 
                            onClick={() => !n.Read_Status && markRead(n.Notification_ID)}
                            className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer relative group ${!n.Read_Status ? 'bg-blue-50/30' : ''}`}>
                            {!n.Read_Status && <div className='absolute left-1.5 top-5 w-1.5 h-1.5 bg-blue-500 rounded-full'></div>}
                            <div className='flex justify-between items-start gap-2'>
                              <p className={`text-xs leading-relaxed ${!n.Read_Status ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                {n.Message}
                              </p>
                              <button 
                                onClick={(e) => deleteNotif(e, n.Notification_ID)}
                                className='opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-400 transition'>
                                <X size={12} />
                              </button>
                            </div>
                            <p className='text-[10px] text-gray-400 mt-1 flex items-center gap-1'>
                              {new Date(n.Sent_At).toLocaleDateString()} • {new Date(n.Sent_At).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className='hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200'>
              <div className='text-right'>
                <p className='text-sm font-semibold text-gray-800'>{userData.name}</p>
                <p className='text-[11px] text-gray-400 capitalize'>{userData.role}</p>
              </div>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleColor} text-white flex items-center justify-center text-xs font-bold`}>
                {userData.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className='flex-1 p-4 md:p-6 overflow-auto'>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AuthLayout
