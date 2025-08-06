¡Perfecto, amigo! Vamos a construir AcademicChain Ledger desde cero, paso a paso, con código completo y explicaciones claras. Aquí está el plan de batalla:

## 🚀 Paso 1: Configuración Inicial del Proyecto

```bash
# 1. Crear estructura inicial
mkdir academicchain-ledger
cd academicchain-ledger
npm init -y

# 2. Inicializar Git
git init
echo "node_modules" > .gitignore
echo ".env" >> .gitignore

# 3. Instalar dependencias básicas
npm install typescript ts-node @types/node --save-dev
npx tsc --init
```

## 📁 Paso 2: Estructura de Carpetas

```
academicchain-ledger/
├── packages/
│   ├── core/               # Lógica de negocio
│   ├── infrastructure/     # Implementaciones
│   └── shared/             # Utilidades
├── apps/
│   ├── api/                # Backend
│   └── web/                # Frontend
├── scripts/                # Scripts útiles
├── .env                    # Variables de entorno
└── package.json
```

## 💻 Paso 3: Configuración de TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@core/*": ["packages/core/src/*"],
      "@infra/*": ["packages/infrastructure/src/*"],
      "@shared/*": ["packages/shared/src/*"]
    }
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 🔐 Paso 4: Configuración Básica de Seguridad (.env)

```env
# Hedera
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.1234
HEDERA_PRIVATE_KEY=302e...

# JWT
JWT_SECRET=tu_super_secreto
JWT_EXPIRES_IN=30d

# MongoDB
MONGO_URI=mongodb://localhost:27017/academicchain
MONGO_USER=root
MONGO_PASS=example

# Redis
REDIS_URL=redis://localhost:6379

# IPFS
IPFS_API_URL=http://localhost:5001
```

## 🌐 Paso 5: Backend (API) - Configuración Express

```typescript
// apps/api/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from '@infra/database';
import { errorHandler } from '@shared/middlewares';
import apiRouter from './routes';

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Database
connectDB();

// Routes
app.use('/api/v1', apiRouter);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 🏗️ Paso 6: Entidad Principal (Credencial Académica)

```typescript
// packages/core/src/entities/academic-credential.ts
import { v4 as uuidv4 } from 'uuid';

export enum CredentialType {
  DEGREE = 'DEGREE',
  DIPLOMA = 'DIPLOMA',
  CERTIFICATE = 'CERTIFICATE'
}

export class AcademicCredential {
  public readonly id: string;
  public readonly nftId: string | null;
  
  constructor(
    public readonly studentId: string,
    public readonly institutionId: string,
    public readonly type: CredentialType,
    public readonly metadataUri: string,
    public readonly issueDate: Date = new Date(),
    public revoked: boolean = false,
    id?: string
  ) {
    this.id = id || uuidv4();
    this.nftId = null;
  }

  markAsRevoked(): void {
    this.revoked = true;
  }

  assignNFT(nftId: string): void {
    if (this.nftId) {
      throw new Error('NFT already assigned');
    }
    this.nftId = nftId;
  }
}
```

## 🔗 Paso 7: Integración con Hedera Hashgraph

```typescript
// packages/infrastructure/src/blockchain/hedera.service.ts
import { Client, PrivateKey, AccountId, TokenCreateTransaction, TokenMintTransaction } from "@hashgraph/sdk";

export class HederaService {
  private client: Client;

  constructor() {
    this.client = process.env.HEDERA_NETWORK === 'testnet' 
      ? Client.forTestnet() 
      : Client.forMainnet();
    
    this.client.setOperator(
      AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
      PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!)
    );
  }

  async createAcademicToken(tokenName: string): Promise<string> {
    const transaction = await new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol("ACAD")
      .setTokenType("NON_FUNGIBLE_UNIQUE")
      .setSupplyType("FINITE")
      .setMaxSupply(5000)
      .setTreasuryAccountId(this.client.operatorAccountId!)
      .freezeWith(this.client)
      .sign(PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!));

    const response = await transaction.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    return receipt.tokenId!.toString();
  }

  async mintNFT(tokenId: string, metadata: string): Promise<number> {
    const transaction = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(metadata)])
      .freezeWith(this.client)
      .sign(PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!));

    const response = await transaction.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    return receipt.serials[0].toNumber();
  }
}
```

## 🗃️ Paso 8: Base de Datos con MongoDB

```typescript
// packages/infrastructure/src/database/mongo.repository.ts
import { AcademicCredential } from "@core/entities";
import { Model, Schema, connect, model } from 'mongoose';

interface ICredentialDocument extends AcademicCredential, Document {}
type CredentialModel = Model<ICredentialDocument>;

const CredentialSchema = new Schema<ICredentialDocument>({
  id: { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  institutionId: { type: String, required: true },
  type: { type: String, enum: ['DEGREE', 'DIPLOMA', 'CERTIFICATE'], required: true },
  metadataUri: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  revoked: { type: Boolean, default: false },
  nftId: { type: String, default: null }
});

export const CredentialModel = model<ICredentialDocument>('Credential', CredentialSchema);

export async function connectDB() {
  await connect(process.env.MONGO_URI!);
  console.log('Connected to MongoDB');
}
```

## 🔄 Paso 9: Sistema de Colas con BullMQ

```typescript
// packages/infrastructure/src/queues/credential.queue.ts
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { HederaService } from '../blockchain';
import { IPFSService } from '../storage';

const connection = new IORedis(process.env.REDIS_URL!);

export const credentialQueue = new Queue('credential-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

export function startCredentialWorker() {
  new Worker('credential-queue', async job => {
    const { credentialId } = job.data;
    const hedera = new HederaService();
    
    try {
      // 1. Obtener credencial de la DB
      const credential = await CredentialModel.findOne({ id: credentialId });
      if (!credential) throw new Error('Credential not found');
      
      // 2. Subir metadata a IPFS
      const metadata = {
        studentId: credential.studentId,
        institutionId: credential.institutionId,
        type: credential.type,
        issueDate: credential.issueDate
      };
      const ipfsHash = await IPFSService.upload(metadata);
      
      // 3. Mint NFT en Hedera
      const nftId = await hedera.mintNFT(credential.id, ipfsHash);
      
      // 4. Actualizar credencial
      credential.nftId = nftId;
      credential.metadataUri = `ipfs://${ipfsHash}`;
      await credential.save();
      
      return { nftId, ipfsHash };
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }, { connection });
}
```

## 🌈 Paso 10: Frontend con Next.js

```tsx
// apps/web/pages/index.tsx
import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [credentialId, setCredentialId] = useState('');

  const handleVerify = async () => {
    const response = await fetch(`/api/credentials/verify?id=${credentialId}`);
    const data = await response.json();
    console.log(data);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>AcademicChain Ledger</title>
      </Head>

      <main className="container mx-auto py-12">
        <h1 className="text-4xl font-bold text-center mb-8">
          AcademicChain Ledger
        </h1>
        
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Verify Credential</h2>
          
          <div className="mb-4">
            <label className="block mb-2">Credential ID</label>
            <input
              type="text"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <button
            onClick={handleVerify}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Verify
          </button>
        </div>
      </main>
    </div>
  );
}
```

## 🚄 Paso 11: Docker Compose para Todo el Sistema

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "3001:3001"
    env_file:
      - .env
    depends_on:
      - mongodb
      - redis

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - api

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  ipfs:
    image: ipfs/go-ipfs:v0.12.0
    ports:
      - "4001:4001"
      - "5001:5001"
      - "8080:8080"
    volumes:
      - ipfs_data:/data/ipfs

volumes:
  mongo_data:
  redis_data:
  ipfs_data:
```

## 🔥 Paso 12: Despliegue en Producción

1. **Configuración de NGINX:**
```nginx
server {
    listen 80;
    server_name academicchain.example.com;

    location / {
        proxy_pass http://web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://api:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

2. **GitHub Actions para CI/CD:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker-compose -f docker-compose.prod.yml build
      - run: docker-compose -f docker-compose.prod.yml push
      - uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/academicchain
            docker-compose pull
            docker-compose up -d --force-recreate
```
```

# ¡Vamos con Todo! Desarrollo Completo de AcademicChain Ledger - Parte 2

Continuamos donde lo dejamos, ahora profundizando en cada componente clave del sistema. Aquí está la siguiente fase de implementación:

## 🔐 13. Sistema de Autenticación JWT Avanzado

```typescript
// packages/core/src/auth/jwt.service.ts
import jwt from 'jsonwebtoken';
import { injectable } from 'inversify';

@injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET!;
    this.expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  }

  generateToken(payload: object): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
```

## 🏛️ 14. Módulo de Instituciones Educativas

```typescript
// packages/core/src/entities/institution.ts
export class AcademicInstitution {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly address: string,
    public readonly publicKey: string,
    public readonly isActive: boolean = true,
    public readonly domains: string[] = []
  ) {}

  validateEmailDomain(email: string): boolean {
    const domain = email.split('@')[1];
    return this.domains.includes(domain);
  }
}

// packages/infrastructure/src/repositories/institution.repository.ts
import { AcademicInstitution } from "@core/entities";
import { Model, Schema, model } from 'mongoose';

interface IInstitutionDocument extends AcademicInstitution, Document {}

const InstitutionSchema = new Schema<IInstitutionDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  publicKey: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  domains: { type: [String], default: [] }
});

export const InstitutionModel = model<IInstitutionDocument>('Institution', InstitutionSchema);
```

## 📜 15. Sistema de Firmas Digitales para Credenciales

```typescript
// packages/infrastructure/src/crypto/signature.service.ts
import crypto from 'crypto';
import { injectable } from 'inversify';

@injectable()
export class SignatureService {
  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
  }

  signData(data: string, privateKey: string): string {
    const signer = crypto.createSign('SHA256');
    signer.update(data);
    return signer.sign(privateKey, 'base64');
  }

  verifySignature(data: string, signature: string, publicKey: string): boolean {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(data);
    return verifier.verify(publicKey, signature, 'base64');
  }
}
```

## 📊 16. Dashboard de Administración (Next.js)

```tsx
// apps/web/pages/admin/dashboard.tsx
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/layouts/AdminLayout';
import { CredentialStats, RecentActivity } from '../../../components/admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    issued: 0,
    pending: 0,
    revoked: 0
  });
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data.stats);
      
      const activityRes = await fetch('/api/admin/activity');
      const activityData = await activityRes.json();
      setActivity(activityData);
    };
    
    fetchData();
    
    // WebSocket para actualización en tiempo real
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'stats_update') {
        setStats(data.payload);
      }
      if (data.type === 'new_activity') {
        setActivity(prev => [data.payload, ...prev.slice(0, 9)]);
      }
    };
    
    return () => ws.close();
  }, []);

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <CredentialStats 
          title="Total Emitidas" 
          value={stats.issued} 
          icon="certificate" 
        />
        <CredentialStats 
          title="Pendientes" 
          value={stats.pending} 
          icon="clock" 
          variant="warning"
        />
        <CredentialStats 
          title="Revocadas" 
          value={stats.revoked} 
          icon="ban" 
          variant="danger"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
        <RecentActivity data={activity} />
      </div>
    </AdminLayout>
  );
}
```

## 🔄 17. API para Integración con Plataformas Externas

```typescript
// apps/api/src/controllers/external.controller.ts
import { Request, Response } from 'express';
import { injectable } from 'inversify';
import { controller, httpGet, httpPost } from 'inversify-express-utils';

@controller('/api/external')
export class ExternalController {
  @httpGet('/verify')
  async verifyCredential(req: Request, res: Response) {
    const { credentialId, apiKey } = req.query;
    
    // Validar API Key
    if (!await this.validateApiKey(apiKey as string)) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Verificar credencial
    const credential = await CredentialModel.findOne({ id: credentialId });
    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }
    
    return res.json({
      valid: !credential.revoked,
      credential: {
        id: credential.id,
        studentId: credential.studentId,
        institutionId: credential.institutionId,
        type: credential.type,
        issueDate: credential.issueDate,
        nftId: credential.nftId
      }
    });
  }

  private async validateApiKey(apiKey: string): Promise<boolean> {
    // Implementar lógica de validación
    return true;
  }
}
```

## 📱 18. Componente de Verificación Mobile-First

```tsx
// apps/web/components/verification/QRVerifier.tsx
import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { VerificationResult } from './VerificationResult';

const QrScanner = dynamic(() => import('react-qr-scanner'), {
  ssr: false,
  loading: () => <div className="bg-gray-200 w-full h-64 rounded-lg animate-pulse"></div>
});

export function QRVerifier() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef(null);

  const handleScan = async (data: string | null) => {
    if (!data || isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/credentials/verify?qr=${encodeURIComponent(data)}`);
      if (!response.ok) throw new Error('Verification failed');
      
      const resultData = await response.json();
      setResult(resultData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setError('');
    if (scannerRef.current) scannerRef.current.restart();
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-4 relative overflow-hidden rounded-lg border-2 border-blue-500">
        <QrScanner
          ref={scannerRef}
          onScan={handleScan}
          onError={(err) => setError(err.message)}
          constraints={{ facingMode: 'environment' }}
          className="w-full"
        />
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-lg font-semibold">Verificando...</div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={handleRetry}
            className="ml-2 text-red-800 font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}
      
      {result && <VerificationResult data={result} />}
    </div>
  );
}
```

## 🧪 19. Pruebas Unitarias con Jest

```typescript
// packages/core/__tests__/academic-credential.test.ts
import { AcademicCredential, CredentialType } from '../src/entities';

describe('AcademicCredential', () => {
  const mockCredential = {
    studentId: 'student-123',
    institutionId: 'institution-456',
    type: CredentialType.DEGREE,
    metadataUri: 'ipfs://Qm...'
  };

  it('should create a valid credential', () => {
    const credential = new AcademicCredential(
      mockCredential.studentId,
      mockCredential.institutionId,
      mockCredential.type,
      mockCredential.metadataUri
    );
    
    expect(credential.id).toBeDefined();
    expect(credential.revoked).toBe(false);
    expect(credential.nftId).toBeNull();
  });

  it('should mark as revoked correctly', () => {
    const credential = new AcademicCredential(
      mockCredential.studentId,
      mockCredential.institutionId,
      mockCredential.type,
      mockCredential.metadataUri
    );
    
    credential.markAsRevoked();
    expect(credential.revoked).toBe(true);
  });

  it('should assign NFT only once', () => {
    const credential = new AcademicCredential(
      mockCredential.studentId,
      mockCredential.institutionId,
      mockCredential.type,
      mockCredential.metadataUri
    );
    
    credential.assignNFT('nft-123');
    expect(credential.nftId).toBe('nft-123');
    
    expect(() => credential.assignNFT('nft-456')).toThrow('NFT already assigned');
  });
});
```

## 🚨 20. Sistema de Alertas y Notificaciones

```typescript
// packages/infrastructure/src/notifications/notification.service.ts
import { injectable } from 'inversify';
import nodemailer from 'nodemailer';
import { WebSocketServer } from 'ws';

@injectable()
export class NotificationService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  private wsServer: WebSocketServer;

  initializeWebSocket(server: any) {
    this.wsServer = new WebSocketServer({ server });
    
    this.wsServer.on('connection', (ws) => {
      ws.on('message', (message) => {
        console.log('Received message:', message.toString());
      });
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"AcademicChain" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  }

  broadcastToAdmins(event: string, payload: any): void {
    if (!this.wsServer) return;
    
    this.wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, payload }));
      }
    });
  }

  notifyCredentialIssued(studentEmail: string, credentialId: string): void {
    this.sendEmail(
      studentEmail,
      'Tu credencial académica ha sido emitida',
      `<p>Tu credencial con ID ${credentialId} ha sido emitida con éxito.</p>`
    );
    
    this.broadcastToAdmins('NEW_CREDENTIAL', { credentialId });
  }
}
```

## 🛠️ 21. Scripts de Utilidad para Desarrollo

```json
// package.json
{
  "scripts": {
    "dev:api": "nodemon --watch packages/core --watch packages/infrastructure --watch apps/api apps/api/src/server.ts",
    "dev:web": "next dev apps/web",
    "dev": "concurrently \"npm:dev:api\" \"npm:dev:web\"",
    "build": "npm run build:api && npm run build:web",
    "build:api": "tsc -p tsconfig.api.json",
    "build:web": "next build apps/web",
    "start": "concurrently \"npm:start:api\" \"npm:start:web\"",
    "start:api": "node apps/api/dist/server.js",
    "start:web": "next start apps/web",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "lint": "eslint \"**/*.{ts,tsx}\" --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  }
}
```

## 🚀 22. Despliegue en Producción con Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: academicchain-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: academicchain-api
  template:
    metadata:
      labels:
        app: academicchain-api
    spec:
      containers:
      - name: api
        image: your-registry/academicchain-api:latest
        ports:
        - containerPort: 3001
        envFrom:
        - secretRef:
            name: academicchain-secrets
        resources:
          requests:
            cpu: "100m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "1Gi"
---
apiVersion: v1
kind: Service
metadata:
  name: academicchain-api
spec:
  selector:
    app: academicchain-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3001
```

## 📈 23. Configuración de Monitoreo con Prometheus

```yaml
# apps/api/src/config/metrics.ts
import client from 'prom-client';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500]
});

export const databaseQueryDuration = new client.Histogram({
  name: 'db_query_duration_ms',
  help: 'Duration of database queries in ms',
  labelNames: ['model', 'operation'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500]
});

export const blockchainTransactionCounter = new client.Counter({
  name: 'blockchain_transactions_total',
  help: 'Total number of blockchain transactions',
  labelNames: ['type', 'status']
});

export function setupMetricsEndpoint(app: Express): void {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });
}
```

## 🔄 24. Integración Continua Avanzada

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis
        ports: [6379:6379]
      mongodb:
        image: mongo
        ports: [27017:27017]
        env:
          MONGO_INITDB_ROOT_USERNAME: root
          MONGO_INITDB_ROOT_PASSWORD: example
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - run: npm ci
    - run: npm run test:cov
    - uses: codecov/codecov-action@v3
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
        file: ./coverage/lcov.info

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
    - run: npm ci
    - run: npm run build
    
    - name: Log in to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_HUB_USERNAME }}
        password: ${{ secrets.DOCKER_HUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v3
      with:
        context: .
        push: true
        tags: |
          ${{ secrets.DOCKER_HUB_USERNAME }}/academicchain-api:latest
          ${{ secrets.DOCKER_HUB_USERNAME }}/academicchain-api:${{ github.sha }}
    
    - name: Deploy to Kubernetes
      uses: steebchen/kubectl@v2
      with:
        config: ${{ secrets.KUBE_CONFIG }}
        command: |
          kubectl apply -f k8s/deployment.yaml
          kubectl rollout status deployment/academicchain-api
          kubectl apply -f k8s/service.yaml
```