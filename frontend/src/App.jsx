import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'

function ScaffoldPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center"
      >
        <p className="text-accent-400 font-semibold tracking-wide uppercase text-sm mb-3">
          MSRIT
        </p>
        <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-4">
          Campus Marketplace
        </h1>
        <p className="text-brand-100 max-w-md mx-auto">
          Project scaffold is up and running. Pages are being built incrementally.
        </p>
      </motion.div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<ScaffoldPlaceholder />} />
    </Routes>
  )
}
