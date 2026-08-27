import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@nexusfit.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left visual panel — clean background */}
      <div className="visual-panel" />

      {/* Right form panel */}
      <div className="form-container">
        <div className="login-panel">
          <div className="login-header">
            <div className="login-logo">
              <i className="fa-solid fa-bolt" />
            </div>
            <h2 className="section-title">Iniciar sesión</h2>
          </div>

          <form onSubmit={submit} className="login-form">
            <div className="form-group">
              <div className="input-with-icon">
                <i className="fa-solid fa-envelope" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <i className="fa-solid fa-lock" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="alert-error">
                <i className="fa-solid fa-circle-exclamation mr-1" />
                {error}
              </div>
            )}

            <div className="btn-login-container">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Cargando...
                  </>
                ) : (
                  <>
                    Iniciar sesión <i className="fa-solid fa-chevron-right" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="auth-footer">
            <p className="footer-text">
              <span className="light">Gestión total para tu gimnasio.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
