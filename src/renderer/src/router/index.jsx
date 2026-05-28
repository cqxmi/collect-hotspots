import Login from '../pages/Login'
import Home from '../pages/Home'
import RequireAuth from './RequireAuth'
import { Navigate } from 'react-router-dom'

export const routers = [
  // 默认首页重定向 → 打开直接跳 /home
  { path: '/', element: <Navigate to="/home" replace /> },
  { path: '/login', element: <Login /> },
  {
    path: '/home',
    element: (
      <RequireAuth>
        <Home />
      </RequireAuth>
    )
  }
]
