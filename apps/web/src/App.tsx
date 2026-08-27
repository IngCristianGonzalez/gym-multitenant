import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Miembros from './pages/Miembros';
import Facturas from './pages/Facturas';
import Inventario from './pages/Inventario';
import Maquinas from './pages/Maquinas';
import Rutinas from './pages/Rutinas';
import Colaboradores from './pages/Colaboradores';
import SuperAdmin from './pages/SuperAdmin';
import Configuracion from './pages/Configuracion';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl" style={{ color: 'var(--brand)' }} />
          <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/miembros" element={<Miembros />} />
        <Route path="/facturas" element={<Facturas />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/maquinas" element={<Maquinas />} />
        <Route path="/rutinas" element={<Rutinas />} />
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
