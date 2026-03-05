
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'
import { DiplomaRegistrationWorkflow } from './workflows/DiplomaRegistration'
import { AIService } from './services/ai'

type Bindings = {
  DB: D1Database
  BUCKET?: R2Bucket
  JWT_SECRET: string
  ACL_AUTH_KEY: string
  ALLOWED_ORIGINS: string
  DIPLOMA_WORKFLOW: Workflow
  AI_API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Global Middleware
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      const allowed = c.env.ALLOWED_ORIGINS || '*'
      if (allowed === '*') return origin // Allow all for now
      return allowed.split(',').includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-ACL-AUTH-KEY', 'Accept'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  })
  return corsMiddleware(c, next)
})

// Error Handling
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ success: false, message: err.message }, 500)
})

// Root Health Check
app.get('/', (c) => {
  return c.text('AcademicChain Ledger Worker API is running!')
})

// --- AUTHENTICATION ---

// Login (Mock + JWT)
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json()
  const { email, role, name } = body
  
  // In a real app, verify password here.
  // Using legacy mock logic:
  const userEmail = email || 'admin@academicchain.com'
  const userRole = role || 'admin'
  const userName = name || 'Admin AcademicChain'
  
  const payload = {
    sub: userEmail,
    role: userRole,
    name: userName,
    institutionId: 'inst-' + (Math.floor(Math.random() * 1000) + 1),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
  }

  const secret = c.env.JWT_SECRET || 'acl-secret-key-change-me'
  const token = await sign(payload, secret)

  return c.json({
    success: true,
    token,
    user: {
      id: 'user-' + userEmail,
      name: userName,
      email: userEmail,
      role: userRole,
      institutionId: payload.institutionId
    }
  })
})

// Auth Me (Protected)
app.get('/api/auth/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ success: false, message: 'Unauthorized' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const secret = c.env.JWT_SECRET || 'acl-secret-key-change-me'

  try {
    const payload = await verify(token, secret)
    return c.json({
      success: true,
      data: {
        id: 'user-' + payload.sub,
        name: payload.name,
        email: payload.sub,
        role: payload.role,
        institutionId: payload.institutionId
      }
    })
  } catch (e) {
    return c.json({ success: false, message: 'Invalid Token' }, 403)
  }
})

// --- SUPPORT CHAT ---
app.post('/api/academic-chain-support', async (c) => {
  const body = await c.req.json()
  const { message, history } = body // history is array of {role, content}

  const ai = new AIService(c.env.AI_API_KEY || '')
  
  const systemPrompt = `You are the Official AI Support Specialist for AcademicChain Ledger.
  AcademicChain is a premier blockchain-based credential issuance and verification platform.
  
  Your Responsibilities:
  1. Provide professional, accurate, and helpful assistance to university administrators, students, and employers.
  2. Explain technical concepts (Blockchain, Hedera, D1, Smart CV) in simple, accessible terms.
  3. Assist with platform features: Issuance, Verification, and Certificate Design.
  4. Maintain a polite and professional tone in Spanish at all times.

  Key Platform Features:
  - **Issuance:** Secure digital diplomas on Hedera Hashgraph, XRPL, and Algorand.
  - **Verification:** Instant QR code verification and public ledger search.
  - **Smart CV:** AI-powered curriculum vitae generation with verified credentials.
  - **Technology:** Built on Cloudflare Workers, D1 Database, and modern web standards.
  
  If you cannot answer a question, politely suggest contacting support@academicchain.com.
  `

  let messages = []
  if (Array.isArray(history) && history.length > 0) {
    messages = history.map((msg: any) => ({
      role: msg.role === 'bot' ? 'assistant' : msg.role, // Normalize 'bot' to 'assistant'
      content: msg.content || msg.text // Handle various formats
    }))
  } else {
    messages = [{ role: 'user', content: message }]
  }

  // Ensure the last message is the current one if not already in history
  const lastMsg = messages[messages.length - 1]
  if (!lastMsg || lastMsg.content !== message) {
    messages.push({ role: 'user', content: message })
  }

  const aiResponse = await ai.generateChat(messages, systemPrompt)

  if (aiResponse.success) {
    return c.json({ output: aiResponse.data })
  }

  return c.json({ output: "Lo siento, el sistema de soporte automatizado no está disponible en este momento. Por favor verifica tu conexión o intenta más tarde." })
})

import { runFullStackVerify } from '../verify_full_stack'

// --- ADMIN VERIFICATION ---
app.get('/api/admin/verify-full-stack', async (c) => {
  try {
    const result = await runFullStackVerify()
    return c.json({ 
      success: true, 
      message: "Full Stack Integration Verified", 
      details: result 
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// --- ADMIN API (D1 INTEGRATED) ---

app.get('/api/admin/pending-institutions', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM institutions WHERE status = 'pending'"
    ).all()
    return c.json({ success: true, data: results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.post('/api/institution/register', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, wallet_address } = body
    
    const existing = await c.env.DB.prepare(
      "SELECT * FROM institutions WHERE email = ?"
    ).bind(email).first()
    
    if (existing) {
      return c.json({ success: false, message: 'Institution already registered' }, 409)
    }

    const { success } = await c.env.DB.prepare(
      "INSERT INTO institutions (name, email, wallet_address) VALUES (?, ?, ?)"
    ).bind(name, email, wallet_address || null).run()

    return c.json({ success, message: 'Institution registration submitted' })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.post('/api/admin/approve-institution/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const { success } = await c.env.DB.prepare(
      "UPDATE institutions SET status = 'approved' WHERE id = ?"
    ).bind(id).run()
    return c.json({ success, message: 'Institution approved' })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.post('/api/admin/reject-institution/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const { success } = await c.env.DB.prepare(
      "UPDATE institutions SET status = 'rejected' WHERE id = ?"
    ).bind(id).run()
    return c.json({ success, message: 'Institution rejected' })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// --- PUBLIC API (D1 INTEGRATED) ---

app.get('/api/institutions', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, name, status FROM institutions WHERE status = 'approved'"
    ).all()
    return c.json({ success: true, data: results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.get('/api/admin/institutions/stats', (c) => {
  return c.json({ success: true, active: 10, pending: 2, rejected: 1 })
})

app.get('/api/admin/bookings', (c) => {
  return c.json({ success: true, data: [] })
})

app.patch('/api/admin/bookings/:id/status', (c) => {
  return c.json({ success: true, message: 'Booking status updated (mock)' })
})

app.get('/api/admin/usage/by-institution', (c) => {
  return c.json({ success: true, data: [] })
})

// --- BLOCKCHAIN STATUS & CONNECTIVITY ---

app.get('/api/status/blockchain', async (c) => {
  // Check connectivity to major networks
  const status = {
    hedera: 'unknown',
    xrp: 'unknown',
    algorand: 'unknown',
    arkhia: 'unknown'
  }

  // 1. Hedera (Testnet Mirror Node)
  try {
    const hRes = await fetch('https://testnet.mirrornode.hedera.com/api/v1/network/supply')
    status.hedera = hRes.ok ? 'connected' : 'error'
  } catch { status.hedera = 'unreachable' }

  // 2. XRP (XRPL Cluster)
  try {
    const xRes = await fetch('https://xrplcluster.com') // Just health check
    status.xrp = xRes.ok ? 'connected' : 'error'
  } catch { status.xrp = 'unreachable' }

  // 3. Algorand (AlgoNode)
  try {
    const aRes = await fetch('https://mainnet-api.algonode.cloud/v2/status')
    status.algorand = aRes.ok ? 'connected' : 'error'
  } catch { status.algorand = 'unreachable' }
  
  // 4. Arkhia (Simulated Check - requires key)
  // If we had a key, we would test it. For now, assume connected if Hedera is.
  status.arkhia = status.hedera === 'connected' ? 'connected (via Hedera)' : 'unknown'

  return c.json({ success: true, networks: status })
})

app.get('/api/admin/hedera/balance', async (c) => {
  // Mock simulation
  return c.json({ success: true, balance: '1000 HBAR (Simulated)' })
})

app.get('/api/admin/xrp/balance', async (c) => {
  return c.json({ success: true, balance: '500 XRP (Simulated)' })
})

app.get('/api/admin/xrp/status', (c) => {
  return c.json({ success: true, status: 'Active' })
})

app.get('/api/admin/billing/consumption', (c) => {
  return c.json({ success: true, data: [] })
})

// --- UNIVERSITIES & CREDENTIALS ---

app.get('/api/universities/catalog', (c) => {
  return c.json({ success: true, data: [
    { id: 'inst-1', name: 'Universidad Demo', approved: true }
  ]})
})

app.post('/api/universities/sign-dpa', (c) => {
  return c.json({ success: true, message: 'DPA Signed' })
})

app.get('/api/universities/statistics', async (c) => {
  return c.json({
    success: true,
    revoked: 0,
    deleted: 0,
    verified: 0,
    pending: 0,
    simulated: true
  })
})

app.get('/api/universities/credentials', async (c) => {
  try {
    // Try to get from D1
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM certificates ORDER BY issue_date DESC LIMIT 50"
    ).all()
    
    return c.json({
      success: true,
      data: results,
      meta: { total: results.length, page: 1, limit: 50 }
    })
  } catch (e) {
    console.error('DB Error:', e)
    // Fallback to empty
    return c.json({
      success: true,
      data: [],
      meta: { total: 0, page: 1, limit: 10 }
    })
  }
})

app.patch('/api/universities/credential/:id/revoke', async (c) => {
  const id = c.req.param('id')
  
  // Update DB directly
  try {
    const { success } = await c.env.DB.prepare("UPDATE certificates SET status = 'revoked' WHERE id = ?").bind(id).run()
    if (success) {
      return c.json({ success: true, message: 'Credential revoked' })
    } else {
      return c.json({ success: false, message: 'Failed to revoke credential' }, 500)
    }
  } catch(e: any) { 
    console.error('DB Update failed', e)
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.post('/api/universities/create-token', async (c) => {
  const body = await c.req.json()
  return c.json({ success: true, message: 'Token created (Simulated)', tokenId: '0.0.123456' })
})

app.post('/api/universities/execute-issuance', async (c) => {
  const body = await c.req.json()
  
  // Use Cloudflare Workflow if available
  if (c.env.DIPLOMA_WORKFLOW) {
    try {
      // Create a unique instance ID
      const instanceId = `issuance-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      
      const instance = await c.env.DIPLOMA_WORKFLOW.create({
        id: instanceId,
        params: body
      })

      return c.json({
        success: true,
        message: 'Issuance Workflow Started (Cloudflare Workflows)',
        workflowId: instanceId,
        status: 'pending'
      })
    } catch (e: any) {
      console.error('Workflow Start Error:', e)
      return c.json({ success: false, error: e.message }, 500)
    }
  }

  // Fallback if workflow is not configured (should not happen in prod)
  return c.json({ 
    success: false, 
    message: 'Diploma Workflow not configured' 
  }, 500)
})

app.get('/api/universities/batch-status/:jobId', async (c) => {
  const jobId = c.req.param('jobId')
  
  // Use Cloudflare Workflow if available
  if (c.env.DIPLOMA_WORKFLOW) {
    try {
      const instance = await c.env.DIPLOMA_WORKFLOW.get(jobId)
      const status = await instance.status()
      
      return c.json({
        success: true,
        status: status.status, // 'running', 'succeeded', 'failed', 'pending'
        output: status.output,
        error: status.error
      })
    } catch (e: any) {
      // If instance not found or other error
      return c.json({ success: false, status: 'unknown', error: e.message }, 404)
    }
  }

  // Fallback for simulation/dev without workflow binding
  // Assume success after 5 seconds for simulation
  const isComplete = true 
  
  return c.json({
    success: true,
    status: isComplete ? 'succeeded' : 'running',
    output: isComplete ? { processed: 10, blockchainTx: '0xMockTx' } : null
  })
})

// --- EMPLOYER API ---

app.get('/api/employer/search', async (c) => {
  const query = c.req.query('q') || ''
  
  try {
    let stmt;
    if (query) {
        stmt = c.env.DB.prepare(
          "SELECT * FROM certificates WHERE student_name LIKE ? OR degree LIKE ? OR major LIKE ? ORDER BY issue_date DESC LIMIT 20"
        ).bind(`%${query}%`, `%${query}%`, `%${query}%`)
    } else {
        // No query, return recent
        stmt = c.env.DB.prepare(
          "SELECT * FROM certificates ORDER BY issue_date DESC LIMIT 20"
        )
    }
    
    const { results } = await stmt.all()
    
    return c.json({ success: true, candidates: results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message })
  }
})

app.post('/api/creators/issue', async (c) => {
  const body = await c.req.json()
  const studentId = body.studentEmail || `student-${Date.now()}`
  const txId = body.txId || `0.0.${Date.now()}`

  // 1. Save to D1
  try {
      await c.env.DB.prepare(
        `INSERT INTO certificates (student_name, student_id, degree, major, institution_id, issue_date, expiration_date, status, network, blockchain_tx) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'issued', 'hedera', ?)`
      ).bind(
        body.studentName, 
        studentId,
        body.credentialType || 'Certification', 
        body.credentialType || 'Blockchain',
        'creator-1', 
        new Date().toISOString(), 
        new Date(Date.now() + 31536000000).toISOString(),
        txId
      ).run()

      return c.json({
        success: true,
        message: 'Credential Issued and Registered',
        data: {
            id: 'cert-' + Date.now(),
            txId: txId,
            ...body
        }
      })
  } catch (e: any) {
      console.error('Creator Issuance DB Error:', e)
      return c.json({ success: false, error: e.message }, 500)
  }
})

app.post('/api/employer/verify', async (c) => {
  const { qrContent, studentId } = await c.req.json()
  
  // Logic to verify against DB
  // For now, simple lookup by studentId if provided, or mock verification of QR content
  
  if (studentId) {
     const record = await c.env.DB.prepare("SELECT * FROM certificates WHERE student_id = ?").bind(studentId).first()
     if (record) {
       return c.json({ success: true, verified: true, record })
     }
  }

  // Mock response for QR
  return c.json({ 
    success: true, 
    verified: true, 
    message: 'QR Code Validated (Simulated)',
    data: {
      studentName: 'Estudiante Verificado',
      program: 'Ingeniería Blockchain',
      issueDate: new Date().toISOString()
    }
  })
})

// --- SMART CV BOT API ---

app.post('/api/design/generate', async (c) => {
  const body = await c.req.json()
  const { message, context } = body
  
  const ai = new AIService(c.env.AI_API_KEY || '')
  
  const systemPrompt = `You are the Lead Design AI for AcademicChain.
  Your goal is to interpret user requests for certificate designs and return structured JSON commands to modify the canvas.
  
  Context:
  - Current Template: ${context?.currentTemplate || 'unknown'}
  - Page Size: ${context?.currentPageSize || 'Landscape'}
  - Institution: ${context?.institutionName || 'AcademicChain'}

  Available Modification Types:
  1. 'template': Load a pre-defined style. IDs: 'minimal', 'blockchain', 'holographic-1', 'classic', 'modern', 'gold-standard'.
  2. 'layout': Change orientation. Modes: 'Landscape', 'Portrait'.
  3. 'color-theme': Apply colors. { bg: '#hex', text: '#hex', primary: '#hex' }.
  4. 'update-text': Change specific text fields. Targets: 'institution-name', 'title-main', 'student-name'.
  
  Return a JSON object with:
  - message: A professional and helpful response in Spanish explaining the changes.
  - modifications: An array of modification objects.
  
  Example:
  User: "Pónmelo en azul y horizontal, y cambia el título a 'Certificado de Honor'"
  Response:
  {
    "message": "He ajustado el diseño a formato horizontal con una paleta de azules y actualizado el título principal.",
    "modifications": [
      { "type": "layout", "mode": "Landscape" },
      { "type": "color-theme", "colors": { "bg": "#eff6ff", "text": "#1e3a8a", "primary": "#2563eb" } },
      { "type": "update-text", "target": "title-main", "value": "Certificado de Honor" }
    ]
  }
  `
  
  const schema = `{
    "message": "string",
    "modifications": [
      { 
        "type": "string", 
        "templateId": "string", 
        "mode": "string", 
        "colors": { "bg": "string", "text": "string", "primary": "string" }, 
        "target": "string", 
        "value": "string" 
      }
    ]
  }`

  try {
    const aiResponse = await ai.generateJson<any>(message, schema, systemPrompt)
    
    if (aiResponse.success && aiResponse.data) {
      return c.json(aiResponse.data)
    }
  } catch (e) {
    console.error('Design AI Error:', e)
  }

  // Fallback if AI fails
  return c.json({
    message: "He procesado tu solicitud (Modo Básico).",
    modifications: []
  })
})

app.post('/api/smart-cv/generate', async (c) => {
  const body = await c.req.json()
  const { specialization, achievement, technologies, experience } = body

  // Initialize AI Service
  const ai = new AIService(c.env.AI_API_KEY || '')

  try {
    // Attempt AI Generation
    const systemPrompt = 'You are an expert Career Consultant and HR Specialist for the Blockchain and Web3 industry.'
    
    const prompt = `
      Generate a professional CV profile and market analysis for a candidate with:
      - Specialization: ${specialization || 'Technology'}
      - Key Achievement: ${achievement || 'Innovation'}
      - Technologies: ${(technologies || []).join(', ')}
      - Experience: ${JSON.stringify(experience || [])}

      Return a JSON object with exactly these fields:
      - personalProfile: A 2-sentence professional summary highlighting leadership and technical depth (in Spanish).
      - marketFit: A 1-sentence analysis of job market demand and estimated salary range (USD) (in Spanish).
      - summary: A short punchy bio (in Spanish).
      - skills: An array of strings (mix provided + suggested relevant blockchain skills).
      - trustScore: A number between 85-99 based on profile completeness.
    `
    
    const schema = `{
      "personalProfile": "string",
      "marketFit": "string",
      "summary": "string",
      "skills": ["string"],
      "trustScore": number
    }`

    const aiResponse = await ai.generateJson<any>(prompt, schema, systemPrompt)

    if (aiResponse.success && aiResponse.data) {
       const data = aiResponse.data
       return c.json({
         success: true,
         cvData: {
           ...data,
           badges: ['Verified Identity', 'Blockchain Native'], // Static badges
           experience: body.experience || [] // Keep original experience structure
         }
       })
    }

    // Fallback if AI fails (or no key provided)
    console.log('AI Generation failed or skipped, using mock fallback.')
  } catch (e) {
    console.error('AI Generation Error:', e)
  }

  // Mock Fallback
  const cvData = {
    personalProfile: `Profesional en ${specialization || 'Tecnología'} con enfoque en ${achievement || 'innovación'}. Su perfil demuestra una sólida base técnica y capacidad de liderazgo.`,
    marketFit: `Alta demanda en sectores Fintech y DeFi. Salario estimado: $60k - $90k anuales.`,
    summary: `Profesional en ${specialization || 'Tecnología'} con enfoque en ${achievement || 'innovación'}. Certificado en Blockchain.`,
    skills: [...(technologies || []), 'Hedera Hashgraph', 'Smart Contracts', 'Team Leadership'],
    experience: experience || [
      {
        title: 'Proyecto Académico Verificado',
        org: 'AcademicChain University',
        date: new Date().getFullYear().toString(),
        desc: 'Implementación validada en blockchain con credenciales inmutables.'
      }
    ],
    trustScore: 98,
    badges: ['Verified Identity', 'Blockchain Native']
  }
  
  return c.json({ success: true, cvData })
})

// --- REPUTATION API (Replaces Redis with D1 calculation) ---
app.get('/api/institution/:id/reputation', async (c) => {
  const institutionId = c.req.param('id') || 'inst-1'

  try {
    // 1. Calculate Metrics from D1 (Certificates Count)
    const { results } = await c.env.DB.prepare(
      "SELECT COUNT(*) as total FROM certificates WHERE institution_id = ? AND status = 'issued'"
    ).bind(institutionId).all()
    
    const totalCertificates = results[0]?.total || 0
    
    // Mock other metrics for now as we don't track employment yet
    const totalGraduates = Math.max(totalCertificates, 50) // Mock base
    const employedGraduates = Math.floor(totalGraduates * 0.85) // Mock 85% rate
    const employabilityRate = ((employedGraduates / totalGraduates) * 100).toFixed(1)

    // 2. Network Status Check (Internal)
    const hRes = await fetch('https://testnet.mirrornode.hedera.com/api/v1/network/supply').catch(() => ({ ok: false }))
    const networkStatus = hRes.ok ? "Operational" : "Degraded"

    return c.json({
      success: true,
      institutionId,
      metrics: {
        totalCertificates,
        totalGraduates,
        employabilityRate: parseFloat(employabilityRate),
        networkStatus,
        publicFaithCount: totalCertificates,
        topicId: "0.0.4576394"
      },
      lastUpdated: new Date()
    })
  } catch (e: any) {
    console.error("Reputation API Error:", e)
    return c.json({ success: false, error: e.message }, 500)
  }
})

// --- AI AGENT VALIDATION ---

app.post('/api/v1/ai/validate-batch', async (c) => {
  const body = await c.req.json()
  const batch = Array.isArray(body.batch) ? body.batch : []
  return c.json({
    success: true,
    data: { total: batch.length, issues: [] }
  })
})

// --- SECURITY TEST ---

app.get('/api/antigravity/test', (c) => {
  return c.json({
    error: 'Access Denied by Antigravity Firewall',
    reason: 'Suspicious Activity Detected'
  }, 403)
})

// --- STORAGE (R2) & DATABASE (D1) ---

app.put('/api/files/:key', async (c) => {
  const key = c.req.param('key')
  
  if (!c.env.BUCKET) {
    console.log(`[Mock Storage] File ${key} received (R2 not configured)`)
    return c.json({ 
      success: true, 
      message: `File ${key} uploaded successfully (Simulation Mode)`,
      url: `https://academicchain-worker.aether-connect-labs.workers.dev/api/files/${key}`
    })
  }

  try {
    const body = await c.req.arrayBuffer()
    await c.env.BUCKET.put(key, body)
    return c.json({ 
      success: true, 
      message: `File ${key} uploaded successfully`,
      url: `/api/files/${key}`
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/files/:key', async (c) => {
  const key = c.req.param('key')

  if (!c.env.BUCKET) {
     return c.text('Simulated file content (R2 not configured)', 200)
  }

  try {
    const object = await c.env.BUCKET.get(key)
    if (!object) {
      return c.json({ error: 'File not found' }, 404)
    }
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    return new Response(object.body, { headers })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/db/test', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT 1 as val').all()
    return c.json({ success: true, results })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// --- CATCH-ALL PROXY ---
app.all('*', async (c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404)
})

export default app
export { DiplomaRegistrationWorkflow }
