import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

// Esta página es el perfil público de un graduado
export default function ProfilePage() {
  const router = useRouter();
  const { did } = router.query;
  const [credentials, setCredentials] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (did) {
      // Llamada a tu API para obtener toda la información pública asociada a este DID
      // GET /api/profile/{did}
      const fetchProfileData = async () => {
        const response = await fetch(`/api/profile/${did}`);
        const data = await response.json();
        setProfile(data.profileInfo); // Info del graduado
        setCredentials(data.credentials); // Lista de NFTs verificados
      };
      fetchProfileData();
    }
  }, [did]);

  if (!profile) return <div>Cargando perfil...</div>;

  return (
    <div>
      <Head>
        <title>{`Perfil Académico de ${profile.name}`}</title>
      </Head>
      <h1>{profile.name}</h1>
      <p>Identidad Verificada: {did}</p>
      <hr />
      <h2>Credenciales Verificadas en Blockchain</h2>
      {credentials.map(cred => (
        <div key={cred.serialNumber}>
          <h3>{cred.degree}</h3>
          <p>Universidad: {cred.universityName}</p>
          <p>Fecha: {cred.graduationYear}</p>
          <p style={{ color: 'green' }}>✓ Verificado en Hedera</p>
        </div>
      ))}
    </div>
  );
}