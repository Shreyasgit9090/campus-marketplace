import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Spinner from './components/ui/Spinner'
import Landing from './pages/Landing'
import Welcome from './pages/Welcome'

export default function App() {
  const { booting } = useAuth()
  if (booting) return <Spinner fullPage />

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/welcome"
        element={
          <ProtectedRoute>
            <Welcome />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
