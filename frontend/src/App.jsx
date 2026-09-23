import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Spinner from './components/ui/Spinner'
import Landing from './pages/Landing'
import RoleSelect from './pages/RoleSelect'
import MyListings from './pages/sell/MyListings'
import NewListing from './pages/sell/NewListing'
import BuyHome from './pages/buy/BuyHome'
import ItemDetail from './pages/buy/ItemDetail'
import MyOrders from './pages/buy/MyOrders'
import OrderDetail from './pages/buy/OrderDetail'

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  const { booting } = useAuth()
  if (booting) return <Spinner fullPage />

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/role" element={<Protected><RoleSelect /></Protected>} />

      <Route path="/sell" element={<Protected><MyListings /></Protected>} />
      <Route path="/sell/new" element={<Protected><NewListing /></Protected>} />

      <Route path="/buy" element={<Protected><BuyHome /></Protected>} />
      <Route path="/buy/:id" element={<Protected><ItemDetail /></Protected>} />

      <Route path="/orders" element={<Protected><MyOrders /></Protected>} />
      <Route path="/orders/:id" element={<Protected><OrderDetail /></Protected>} />

      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
