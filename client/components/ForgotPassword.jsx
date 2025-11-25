import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from './authService';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(e.message || 'Error al solicitar recuperación.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Recuperar Contraseña</h1>
      <p className="text-gray-600 mb-6">Ingresa tu correo para enviarte un enlace de recuperación.</p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tu.email@gmail.com"
            required
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!sent ? (
          <button type="submit" className="btn-primary" disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar enlace'}
          </button>
        ) : (
          <div className="text-sm text-green-600">Si el correo existe, te enviamos un enlace de recuperación.</div>
        )}
      </form>
      <div className="mt-6">
        <button onClick={() => navigate('/login')} className="btn-secondary">Volver al inicio de sesión</button>
      </div>
    </div>
  );
};

export default ForgotPassword;