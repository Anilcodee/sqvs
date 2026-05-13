import React, { createContext, useState, useEffect } from 'react'
import axios from 'axios'

export const dataContext = createContext()

const UserContext = ({ children }) => {
  const serverUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  const getUserData = async () => {
    try {
      const { data } = await axios.get(serverUrl + '/api/auth/me', { withCredentials: true })
      setUserData(data.user)
    } catch (error) {
      console.log(error)
      setUserData(null)
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem('sqvs_user')
    if (stored) {
      setUserData(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const value = { userData, setUserData, serverUrl, getUserData, loading, setLoading }

  return (
    <dataContext.Provider value={value}>
      {children}
    </dataContext.Provider>
  )
}

export default UserContext
