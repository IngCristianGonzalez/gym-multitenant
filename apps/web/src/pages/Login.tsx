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
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg text-content px-4">
      <form
        onSubmit={submit}
        className="card p-6 sm:p-8 w-full max-w-sm space-y-5 animate-fade-up"
      >
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand/10 flex items-center justify-center mb-3">
            <i className="fa-solid fa-dumbbell text-brand text-2xl" />
          </div>
          <h1 className="text-xl font-bold">Gym Multiempresa</h1>
          <p className="text-sm text-muted mt-1">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-3 py-2.5 flex items-start gap-2">
            <i className="fa-solid fa-circle-exclamation mt-0.5" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="field-label">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gym.com"
              className="input"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="field-label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-hero w-full justify-center !py-3"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin" />
              Ingresando...
            </>
          ) : (
            <>
              <i className="fa-solid fa-right-to-bracket" />
              Ingresar
            </>
          )}
        </button>
      </form>
    </div>
  );
}
