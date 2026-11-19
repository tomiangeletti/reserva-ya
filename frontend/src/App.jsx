import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './api/auth'
import { ClubProvider } from './api/club'
import AdminLayout from './pages/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import CanchasPage from './pages/admin/CanchasPage'
import ConfiguracionPage from './pages/admin/ConfiguracionPage'
import AyudaPage from './pages/admin/AyudaPage'
import LoginPage from './pages/admin/LoginPage'
import PasswordResetPage from './pages/admin/PasswordResetPage'
import ReservasPage from './pages/admin/ReservasPage'
import NotFoundPage from './pages/notfound/NotFoundPage'
import PrivacidadPage from './pages/privacidad/PrivacidadPage'
import ReservarPage from './pages/reservar/ReservarPage'

function App() {
  return (
    <ClubProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/reservar" replace />} />
          <Route path="/reservar" element={<ReservarPage />} />
          <Route path="/privacidad" element={<PrivacidadPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/recuperar-password" element={<PasswordResetPage />} />
          <Route path="/reset-password" element={<PasswordResetPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="reservas" element={<ReservasPage />} />
            <Route path="canchas" element={<CanchasPage />} />
            <Route path="config" element={<ConfiguracionPage />} />
            <Route path="cambiar-password" element={<PasswordResetPage />} />
            <Route path="ayuda" element={<AyudaPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ClubProvider>
  )
}

export default App
