import { createContext, useContext, useEffect, useState } from "react"
import { getCurrentUser } from "../services/auth.service"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const token = localStorage.getItem("token")

    if (!token) {
      setLoading(false)
      return
    }

    const fetchUser = async () => {

      try {

        const res = await getCurrentUser()

        setUser(res.data)

      } catch (error) {

        console.error("Failed to fetch user")

        localStorage.removeItem("token")

      } finally {

        setLoading(false)

      }

    }

    fetchUser()

  }, [])

  const logout = () => {

    localStorage.removeItem("token")

    setUser(null)

    window.location.href = "/login"

  }

  return (

    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        loading
      }}
    >

      {children}

    </AuthContext.Provider>

  )

}

export const useAuth = () => useContext(AuthContext)