import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@gym.com');
  const [password, setPassword] = useState('secret123');
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
      setError('Credenciales invalidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm animate-fade-up"
        style={{
          background: 'var(--surface)',
          borderRadius: '24px',
          padding: '2rem 1.5rem',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
        }}
      >
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(43,138,94,0.08)' }}
          >
            <i className="fa-solid fa-dumbbell text-2xl" style={{ color: 'var(--brand)' }} />
          </div>
          <h1 className="text-xl font-bold">Gym Multiempresa</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Inicia sesion para continuar
          </p>
        </div>

        {error && (
          <div
            className="text-sm px-4 py-3 flex items-start gap-2 mb-4"
            style={{
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(217,74,74,0.08)',
              color: '#d94a4a',
              border: '1.5px solid rgba(217,74,74,0.2)',
            }}
          >
            <i className="fa-solid fa-circle-exclamation mt-0.5" />
            {error}
          </div>
        )}

        <div className="space-y-4 mb-5">
          <div>
            <label className="field-label">Correo electronico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gym.com"
              className="input"
              style={{ padding: '0.75rem 1rem' }}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="field-label">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              style={{ padding: '0.75rem 1rem' }}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-semibold text-white transition-all"
          style={{
            padding: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--text)',
            color: 'var(--bg)',
            fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            border: 'none',
            fontFamily: 'inherit',
          }}
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin mr-2" />
              Ingresando...
            </>
          ) : (
            <>
              <i className="fa-solid fa-right-to-bracket mr-2" />
              Ingresar
            </>
          )}
        </button>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          Desarrollado por IngCristianGonzalez
        </p>
      </form>
    </div>
  );
}
