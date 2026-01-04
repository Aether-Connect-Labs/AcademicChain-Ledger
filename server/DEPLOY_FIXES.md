# Solución de Errores en Koyeb y Filecoin

## 1. Error de Construcción (Build Failed)
El error `npm ci failed` en Koyeb se debe a que el archivo `package-lock.json` estaba desactualizado (faltaba `algosdk` y otras dependencias).

**Solución:**
He ejecutado `npm install` localmente para sincronizar el archivo. Ahora **debes subir este cambio a GitHub**:

```bash
# En tu terminal local:
git add server/package-lock.json
git commit -m "Fix: Update package-lock.json for Koyeb deployment"
git push origin main
```

Una vez hecho esto, Koyeb detectará el cambio y reconstruirá el servicio automáticamente.

## 2. Conexión a Filecoin
Tu código ya tiene integración con Filecoin a través de **web3.storage**, pero faltaba la variable de entorno para activarlo.

**Pasos para activar:**
1. Ve a [web3.storage](https://web3.storage/) y crea una cuenta gratuita.
2. Crea un **API Token**.
3. En tu panel de **Koyeb**, ve a la sección **Settings > Environment Variables**.
4. Añade una nueva variable:
   - **Key**: `WEB3_STORAGE_TOKEN`
   - **Value**: (Pega tu token aquí)

Si no añades este token, el sistema seguirá funcionando usando **Pinata (IPFS)** como almacenamiento principal, pero sin la copia de redundancia en Filecoin.

## 3. Nota sobre Wallet (Admin)
Entendido. El botón "Conectar Wallet" en el menú se mantendrá, ya que tú (el Admin) lo necesitas para emitir credenciales. Los usuarios que solo reciben o verifican no necesitan conectarla obligatoriamente, pero la opción está ahí si la plataforma evoluciona.
