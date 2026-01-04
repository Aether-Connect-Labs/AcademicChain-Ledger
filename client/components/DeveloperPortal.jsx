import React, { useState } from 'react';
import developerService from './services/developerService';

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
    try {
      const data = await developerService.register({ email, name, password, plan });
      setVerifyToken(data?.data?.verificationToken || ''); 
      setMessage('Registro creado, verifica tu email'); 
    } catch (e) {
      setMessage(e.message || 'Error'); 
    }
  };

  const verifyEmail = async () => {
    setMessage('');
    try {
      const data = await developerService.verifyEmail(verifyToken);
      setMessage(data.message || 'Email verificado');
    } catch (e) {
      setMessage(e.message || 'Error');
    }
  };

  const login = async () => {
    setMessage('');
    try {
      const data = await developerService.login(email, password);
      setJwt(data?.data?.token || ''); 
      setMessage('Login ok'); 
    } catch (e) {
      setMessage(e.message || 'Error'); 
    }
  };

  const issueKey = async () => {
    setMessage('');
    try {
      const data = await developerService.issueApiKey(jwt);
      setApiKey(data?.data?.apiKey || ''); 
      setMessage('API Key emitida'); 
    } catch (e) {
      setMessage(e.message || 'Error'); 
    }
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
      
      {message && (
        <div className="mt-6 p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-800">
          {message}
        </div>
      )}
    </div>
  );
};

export default DeveloperPortal;
