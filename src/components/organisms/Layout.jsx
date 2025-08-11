import React, { useContext } from "react"
import { Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import Sidebar from "@/components/organisms/Sidebar"
import { AuthContext } from "../../App"

const Layout = () => {
  const { isInitialized, logout } = useContext(AuthContext)
  const { user, isAuthenticated } = useSelector((state) => state.user)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout