import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Spinner from './components/ui/Spinner'
import Landing from './pages/Landing'
import RoleSelect from './pages/RoleSelect'
import MyListings from './pages/sell/MyListings'
import NewListing from './pages/sell/NewListing'

export default function App() {
  const { booting } = useAuth()
  if (booting) return <Spinner fullPage />

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/role"
        element={
          <ProtectedRoute>
            <RoleSelect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sell"
        element={
          <ProtectedRoute>
            <MyListings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sell/new"
        element={
          <ProtectedRoute>
            <NewListing />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
