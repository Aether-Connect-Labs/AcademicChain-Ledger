import React, { useState } from 'react';
let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '')

const DeveloperPortal = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState('free');
  const [verifyToken, setVerifyToken] = useState('');
  const [jwt, setJwt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');

  const register = async () => {
    setMessage('');
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name, password, plan })
    });
    const data = await res.json();
    if (res.ok) { setVerifyToken(data?.data?.verificationToken || ''); setMessage('Registro creado, verifica tu email'); } else { setMessage(data.message || 'Error'); }
  };

  const verifyEmail = async () => {
    setMessage('');
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/verify-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: verifyToken })
    });
    const data = await res.json();
    setMessage(data.message || (res.ok ? 'Email verificado' : 'Error'));
  };

  const login = async () => {
    setMessage('');
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) { setJwt(data?.data?.token || ''); setMessage('Login ok'); } else { setMessage(data.message || 'Error'); }
  };

  const issueKey = async () => {
    setMessage('');
    const res = await fetch(`${API_BASE_URL}/api/v1/developers/api-keys/issue`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` }, body: JSON.stringify({})
    });
    const data = await res.json();
    if (res.ok) { setApiKey(data?.data?.apiKey || ''); setMessage('API Key emitida'); } else { setMessage(data.message || 'Error'); }
  };

  return (
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Portal de Desarrolladores</h1>
      <p className="text-gray-600 mb-6">Regístrate, verifica tu email, inicia sesión y emite tu API Key.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="font-semibold mb-4">Registro</div>
          <input className="input-primary mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-primary mb-2" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input-primary mb-2" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <select className="input-primary mb-2" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="free">Free</option>
            <option value="startup">Startup</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <button className="btn-primary" onClick={register}>Registrar</button>
        </div>

        <div className="card p-6">
          <div className="font-semibold mb-4">Verificar Email</div>
          <input className="input-primary mb-2" placeholder="Token de verificación" value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} />
          <button className="btn-secondary" onClick={verifyEmail}>Verificar</button>
        </div>

        <div className="card p-6">
          <div className="font-semibold mb-4">Login</div>
          <input className="input-primary mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-primary mb-2" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn-primary" onClick={login}>Iniciar Sesión</button>
          {jwt && <div className="mt-2 text-xs break-all">JWT: {jwt}</div>}
        </div>

        <div className="card p-6">
          <div className="font-semibold mb-4">Emitir API Key</div>
          <button className="btn-primary" onClick={issueKey} disabled={!jwt}>Emitir</button>
          {apiKey && <div className="mt-2 text-xs break-all">API Key: {apiKey}</div>}
        </div>
      </div>

      {message && <div className="mt-6 badge badge-info">{message}</div>}
    </div>
  );
};

export default DeveloperPortal;
