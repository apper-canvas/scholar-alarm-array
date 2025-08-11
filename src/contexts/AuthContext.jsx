import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setUser, clearUser } from '@/store/userSlice'

// Create the AuthContext
export const AuthContext = createContext({
  isInitialized: false,
  user: null,
  isAuthenticated: false,
  logout: () => {}
})

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Get authentication status with proper error handling
  const userState = useSelector((state) => state.user)
  const user = userState?.user || null
  const isAuthenticated = userState?.isAuthenticated || false
  
  // Initialize ApperUI once when the provider loads
  useEffect(() => {
    const { ApperClient, ApperUI } = window.ApperSDK
    
    const client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
    
    // Initialize authentication
    ApperUI.setup(client, {
      target: '#authentication',
      clientId: import.meta.env.VITE_APPER_PROJECT_ID,
      view: 'both',
      onSuccess: function (user) {
        setIsInitialized(true)
        // CRITICAL: This exact currentPath logic must be preserved
        let currentPath = window.location.pathname + window.location.search
        let redirectPath = new URLSearchParams(window.location.search).get('redirect')
        const isAuthPage = currentPath.includes('/login') || currentPath.includes('/signup') || 
                           currentPath.includes('/callback') || currentPath.includes('/error') || 
                           currentPath.includes('/prompt-password') || currentPath.includes('/reset-password')
        
        if (user) {
          // User is authenticated
          if (redirectPath) {
            navigate(redirectPath)
          } else if (!isAuthPage) {
            if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
              navigate(currentPath)
            } else {
              navigate('/')
            }
          } else {
            navigate('/')
          }
          // Store user information in Redux
          dispatch(setUser(JSON.parse(JSON.stringify(user))))
        } else {
          // User is not authenticated
          if (!isAuthPage) {
            navigate(
              currentPath.includes('/signup')
                ? `/signup?redirect=${currentPath}`
                : currentPath.includes('/login')
                ? `/login?redirect=${currentPath}`
                : '/login'
            )
          } else if (redirectPath) {
            if (
              !['error', 'signup', 'login', 'callback', 'prompt-password', 'reset-password'].some((path) => currentPath.includes(path))
            ) {
              navigate(`/login?redirect=${redirectPath}`)
            } else {
              navigate(currentPath)
            }
          } else if (isAuthPage) {
            navigate(currentPath)
          } else {
            navigate('/login')
          }
          dispatch(clearUser())
        }
      },
      onError: function(error) {
        console.error("Authentication failed:", error)
        setIsInitialized(true) // Still set initialized even on error
      }
    })
  }, [navigate, dispatch])
  
  // Authentication methods
  const logout = async () => {
    try {
      const { ApperUI } = window.ApperSDK
      await ApperUI.logout()
      dispatch(clearUser())
      navigate('/login')
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }
  
  const value = {
    isInitialized,
    user,
    isAuthenticated,
    logout
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext