import { Navigate } from 'react-router-dom'

// eslint-disable-next-line react/prop-types
export default function RequireAuth({ children }) {
  const token = window.store.get('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}
