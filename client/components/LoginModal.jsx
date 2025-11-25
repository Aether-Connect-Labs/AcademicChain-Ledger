import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import { authService } from './authService';

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const LoginModal = ({ open, onClose, userType = 'student' }) => {
  const { login, error, verifyCode } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [codeInputs, setCodeInputs] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uiError, setUiError] = useState('');
  const inputRefs = useRef([]);
  const [sendingCode, setSendingCode] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep('credentials');
      setEmail('');
      setPassword('');
      setSentCode('');
      setCodeInputs(['', '', '', '', '', '']);
      setCountdown(0);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const canResend = countdown === 0;
  const codeValue = useMemo(() => codeInputs.join(''), [codeInputs]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setSendingCode(true);
    setUiError('');
    try {
      await authService.requestLoginCode(email, userType);
      setSentCode('');
    } catch (err) {
      setUiError(err?.message || 'No se pudo enviar el código.');
    } finally {
      setSendingCode(false);
    }
    setStep('code');
    setCountdown(30);
    setTimeout(() => {
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, 50);
  };

  const handleResend = async () => {
    if (!canResend) return;
    setSendingCode(true);
    setUiError('');
    try {
      await authService.requestLoginCode(email, userType);
      setSentCode('');
    } catch (err) {
      setUiError(err?.message || 'No se pudo reenviar el código.');
    } finally {
      setSendingCode(false);
    }
    setCodeInputs(['', '', '', '', '', '']);
    setCountdown(30);
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  };

  const handleCodeChange = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(0, 1);
    const next = [...codeInputs];
    next[idx] = v;
    setCodeInputs(next);
    if (v && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !codeInputs[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setUiError('');
    if (codeValue.length !== 6 || !sentCode) {
      setUiError('Ingresa los 6 dígitos.');
      return;
    }
    const valid = await verifyCode(email, codeValue);
    if (!valid) {
      setUiError('Código inválido. Debe tener 6 dígitos.');
      return;
    }
    try {
      await authService.verifyLoginCode(email, codeValue, userType);
    } catch (err) {
      setUiError(err?.message || 'Código de verificación incorrecto.');
      return;
    }
    setSubmitting(true);
    const ok = await login(email, password, userType);
    setSubmitting(false);
    if (ok) onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-strong w-full max-w-sm sm:max-w-md border border-gray-200">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 id="login-modal-title" className="text-xl font-bold">Acceso {userType === 'institution' ? 'Instituciones' : 'Alumnos'}</h3>
            <button onClick={onClose} className="btn-ghost">✕</button>
          </div>

          {step === 'credentials' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="tu.email@institucion.edu" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="min 6 caracteres" required />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <button type="submit" className="btn-primary w-full">Enviar Código</button>
              <p className="text-xs text-gray-500">Simularemos el envío de un código de verificación a tu correo.</p>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-gray-700">Ingresa el código de 6 dígitos enviado a {email}.</p>
              <div className="flex items-center justify-between gap-2 code-inputs">
                {[0,1,2,3,4,5].map((i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-10 h-10 text-center text-base sm:w-12 sm:h-12 sm:text-xl border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={codeInputs[i]}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  />
                ))}
              </div>
              {uiError && (
                <div className="text-sm text-red-600" aria-live="polite">{uiError}</div>
              )}
              <div className="flex items-center justify-between">
                <button type="button" disabled={!canResend || sendingCode} onClick={handleResend} className={`btn-ghost ${(!canResend || sendingCode) ? 'opacity-50 cursor-not-allowed' : ''}`}>{sendingCode ? 'Enviando…' : `Reenviar código ${countdown > 0 ? `(${countdown}s)` : ''}`}</button>
                <button type="submit" className="btn-primary" disabled={submitting || codeValue.length !== 6}>{submitting ? 'Verificando…' : 'Verificar y Acceder'}</button>
              </div>
            </form>
          )}
          <div className="login-options mt-4">
            <button type="button" className="text-link" onClick={() => navigate(userType === 'institution' ? '/institution/register' : '/register')}>
              ¿No tienes cuenta? Crear una
            </button>
            <button type="button" className="text-link" onClick={() => navigate('/forgot-password')}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;