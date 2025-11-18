import React, { useState } from 'react';
import { useAuth } from './useAuth';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [hederaAccountId, setHederaAccountId] = useState(user?.hederaAccountId || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, hederaAccountId })
      });
      if (!res.ok) throw new Error('Error al guardar');
      setMessage('Perfil actualizado');
    } catch (e) {
      setMessage('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Mi Perfil</h1>
      <div className="space-y-4 bg-white p-6 rounded-2xl border">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Correo</label>
                  <input value={email} disabled className="w-full border rounded-lg px-3 py-2 bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">El correo se gestiona desde autenticación.</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cuenta Hedera</label>
                  <input value={hederaAccountId} onChange={e => setHederaAccountId(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="0.0.xxxxxx" />
                  <p className="text-xs text-gray-500 mt-1">Conecta tu cuenta Hedera para recibir credenciales.</p>
                </div>
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded-lg">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
        {message && <p className="text-sm text-green-600">{message}</p>}
      </div>
    </div>
  );
};

export default Profile;