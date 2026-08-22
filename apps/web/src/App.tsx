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

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-500">Cargando...</p>
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
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
