export const mockCredentials = {
    studentName: "Estudiante de Prueba",
    courseName: "Carrera Ejemplo",
    issueDate: "01/01/2026",
    tokenId: "0.0.123456",
    university: "Universidad AcademicChain",
    qrCode: "https://academicchain.com/verify/mock"
};

export const templates = [
    {
        id: 'minimal',
        name: 'Tech Minimalist [Smart Contract]',
        category: 'Modern',
        tags: ['simple', 'clean', 'tech'],
        thumbnail: 'bg-slate-50',
        bg: '#f8fafc',
        objects: [
            { type: 'i-text', text: '{{STUDENT_NAME}}', left: 400, top: 300, fontSize: 30, fontFamily: 'Arial', fill: '#0f172a', originX: 'center' },
            { type: 'i-text', text: '{{DEGREE}}', left: 400, top: 200, fontSize: 40, fontFamily: 'Orbitron', fill: '#2563eb', originX: 'center' }
        ]
    },
    {
        id: 'blockchain',
        name: 'Blockchain Elite [Multi-Chain]',
        category: 'Sovereign',
        tags: ['crypto', 'purple', 'border'],
        thumbnail: 'bg-white border-2 border-purple-500',
        bg: '#ffffff',
        objects: [
            { type: 'rect', left: 20, top: 20, width: 760, height: 560, fill: 'transparent', stroke: '#7c3aed', strokeWidth: 5 },
            { type: 'i-text', text: '{{STUDENT_NAME}}', left: 400, top: 320, fontSize: 32, fontFamily: 'Inter', fill: '#1e293b', originX: 'center' },
            { type: 'i-text', text: '{{DEGREE}}', left: 400, top: 220, fontSize: 45, fontFamily: 'Orbitron', fill: '#7c3aed', originX: 'center' },
            { type: 'text', text: 'Secured by Hedera & XRP Ledger', left: 400, top: 550, fontSize: 12, fill: '#64748b', originX: 'center' }
        ]
    },
    {
        id: 'holographic-1',
        name: 'Holographic Future [NFT Mode]',
        category: 'Holographic',
        tags: ['neon', 'dark', 'cyber'],
        thumbnail: 'bg-slate-900 border border-cyan-400',
        bg: '#0f172a',
        objects: [
            { type: 'rect', left: 0, top: 0, width: 800, height: 600, fill: '#0f172a' },
            { type: 'i-text', text: '{{DEGREE}}', left: 400, top: 200, fontSize: 50, fontFamily: 'Orbitron', fill: '#06b6d4', shadow: '0 0 20px #06b6d4', originX: 'center' },
            { type: 'i-text', text: '{{STUDENT_NAME}}', left: 400, top: 350, fontSize: 35, fontFamily: 'Inter', fill: '#e2e8f0', originX: 'center' },
            { type: 'text', text: 'IMMUTABLE PROOF [Filecoin Storage]', left: 400, top: 500, fontSize: 14, fill: '#94a3b8', originX: 'center', letterSpacing: 200 }
        ]
    },
    {
        id: 'gold-standard',
        name: 'Gold Standard',
        category: 'Classic',
        tags: ['diploma', 'gold', 'formal'],
        thumbnail: 'bg-orange-50',
        bg: '#fff7ed',
        objects: [
            { type: 'rect', left: 20, top: 20, width: 760, height: 560, fill: 'transparent', stroke: '#b45309', strokeWidth: 8 },
            { type: 'i-text', text: 'CERTIFICADO DE LOGRO', left: 400, top: 100, fontSize: 24, fontFamily: 'Serif', fill: '#78350f', originX: 'center' },
            { type: 'i-text', text: '{{STUDENT_NAME}}', left: 400, top: 300, fontSize: 40, fontFamily: 'Serif', fill: '#000000', originX: 'center' },
            { type: 'i-text', text: '{{DEGREE}}', left: 400, top: 400, fontSize: 28, fontFamily: 'Serif', fill: '#92400e', originX: 'center' }
        ]
    }
];
