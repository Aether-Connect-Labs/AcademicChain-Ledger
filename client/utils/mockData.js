﻿export const mockCredentials = [
    { 
      studentName: 'Ana García', 
      title: 'Título: Ingeniería de Software', 
      id: '0.0.123456', 
      tokenId: '0.0.123456',
      status: 'confirmed', 
      type: 'titulo', 
      createdAt: new Date().toISOString(),
      ipfsCid: 'QmXyZ12345abcde67890fghij12345klmno67890pqrs',
      ipfsHash256: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
      xrpHash: null,
      algorandHash: null,
      ipfsURI: 'ipfs://QmXyZ12345abcde67890fghij12345klmno67890pqrs',
      networkType: 'single', // Hedera Only
      metadata: {
        degree: 'Ingeniería de Software',
        institution: 'AcademicChain Ledger'
      }
    },
    { 
      studentName: 'Carlos López', 
      title: 'Título: Arquitectura', 
      id: '0.0.789012', 
      tokenId: '0.0.789012',
      status: 'confirmed', 
      type: 'titulo', 
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      ipfsCid: 'QmAbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEf',
      ipfsHash256: 'f1e2d3c4b5a697887766554433221100f1e2d3c4b5a697887766554433221100',
      xrpHash: 'X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1',
      algorandHash: null,
      ipfsURI: 'ipfs://QmAbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEf',
      networkType: 'dual', // Hedera + XRP
      metadata: {
        degree: 'Arquitectura',
        institution: 'AcademicChain Ledger'
      }
    },
    { 
      studentName: 'Maria Rodriguez', 
      title: 'Título: Master en Data Science', 
      id: '0.0.456789', 
      tokenId: '0.0.456789',
      status: 'verified', 
      type: 'titulo', 
      createdAt: new Date(Date.now() - 2*86400000).toISOString(),
      ipfsCid: 'Qm1234567890abcdef1234567890abcdef1234567890',
      ipfsHash256: '9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      xrpHash: 'R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0',
      algorandHash: 'G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4',
      ipfsURI: 'ipfs://Qm1234567890abcdef1234567890abcdef1234567890',
      networkType: 'triple', // Hedera + XRP + Algorand
      metadata: {
        degree: 'Master en Data Science',
        institution: 'AcademicChain Ledger'
      }
    }
];

// Dimensions for A4 Landscape: 1123 x 794
// Dimensions for A4 Portrait: 794 x 1123
// Center Landscape: 561.5, 397
// Center Portrait: 397, 561.5

export const templates = [
    {
        id: 'minimal',
        name: 'Tech Minimalist [Smart Contract]',
        category: 'Modern',
        tags: ['simple', 'clean', 'tech'],
        thumbnail: 'bg-slate-50',
        bg: '#f8fafc',
        pageSize: 'Portrait',
        objects: [
            // Background Layer
            { type: 'rect', left: 397, top: 561.5, width: 794, height: 1123, fill: '#f8fafc', originX: 'center', originY: 'center', selectable: false, data: { type: 'background-main' } },
            
            // Left Sidebar Strip (Full Height)
            { type: 'rect', left: 40, top: 561.5, width: 80, height: 1123, fill: '#1e293b', originX: 'center', originY: 'center', data: { type: 'sidebar-left' } },
            
            // Top Accent Bar (Starts after sidebar)
            // Sidebar width 80. Canvas width 794. Remaining 714. Center of remaining: 80 + 357 = 437.
            { type: 'rect', left: 437, top: 20, width: 714, height: 40, fill: '#3b82f6', originX: 'center', originY: 'center', data: { type: 'header-bar' } },

            // Institution Logo (Top Left in Sidebar)
            { type: 'circle', left: 40, top: 60, radius: 25, fill: '#3b82f6', originX: 'center', originY: 'center', data: { type: 'logo-bg' } },
            { type: 'i-text', text: 'AC', left: 40, top: 70, fontSize: 18, fontFamily: 'Inter', fill: '#ffffff', originX: 'center', fontWeight: 'bold', data: { type: 'logo-text' } },
            
            // Institution Name
            { type: 'i-text', text: 'AcademicChain Ledger', left: 437, top: 100, fontSize: 16, fontFamily: 'Inter', fill: '#334155', originX: 'center', fontWeight: 'bold', letterSpacing: 2, data: { type: 'institution-name' } },

            // Main Title Area (Centered in printable area: 437)
            { type: 'i-text', text: 'CERTIFICADO DE FINALIZACIÓN', left: 437, top: 150, fontSize: 32, fontFamily: 'Inter', fill: '#334155', originX: 'center', letterSpacing: 4, fontWeight: 'bold', textAlign: 'center', splitByGrapheme: true, width: 600, data: { type: 'title-main' } },
            
            { type: 'i-text', text: 'Este documento certifica que', left: 437, top: 220, fontSize: 18, fontFamily: 'Inter', fill: '#64748b', originX: 'center', data: { type: 'text-intro' } },
            
            { type: 'i-text', text: '{{STUDENT_NAME}}', left: 437, top: 300, fontSize: 40, fontFamily: 'Inter', fill: '#0f172a', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 600, data: { type: 'student-name', isSmart: true } },
            
            { type: 'rect', left: 437, top: 340, width: 300, height: 2, fill: '#cbd5e1', originX: 'center', originY: 'center', data: { type: 'separator-line' } },
            
            { type: 'i-text', text: 'ha completado con éxito el programa de', left: 437, top: 390, fontSize: 18, fontFamily: 'Inter', fill: '#64748b', originX: 'center', textAlign: 'center', width: 600, data: { type: 'text-body' } },
            
            { type: 'i-text', text: '{{DEGREE}}', left: 437, top: 450, fontSize: 32, fontFamily: 'Inter', fill: '#2563eb', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 600, data: { type: 'degree-name', isSmart: true } },

            // Signatures (Vertical arrangement or Side-by-Side compacted)
            // Let's do center signature for vertical
            { type: 'rect', left: 437, top: 800, width: 200, height: 1, fill: '#000000', originX: 'center', originY: 'center', data: { type: 'sig-line' } },
            { type: 'i-text', text: 'Director Académico', left: 437, top: 820, fontSize: 14, fontFamily: 'Inter', fill: '#64748b', originX: 'center', data: { type: 'sig-text' } },

            // Footer / Details
            { type: 'i-text', text: 'Fecha de Emisión: 01/01/2026', left: 120, top: 1050, fontSize: 12, fontFamily: 'Inter', fill: '#64748b', originX: 'left', data: { type: 'text-footer-1' } },
            { type: 'i-text', text: 'Credencial ID: {{TOKEN_ID}}', left: 120, top: 1070, fontSize: 12, fontFamily: 'Inter', fill: '#64748b', originX: 'left', data: { type: 'text-footer-2' } },

            // QR Code Area (Bottom Center of Content)
            { type: 'rect', left: 437, top: 950, width: 110, height: 110, fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 2, originX: 'center', originY: 'center', data: { type: 'qr-bg' } },
            { type: 'image', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/200px-QR_code_for_mobile_English_Wikipedia.svg.png', left: 437, top: 950, width: 100, height: 100, originX: 'center', originY: 'center', crossOrigin: 'anonymous', data: { type: 'qr-placeholder', name: 'QR Code', isQR: true } },
            { type: 'i-text', text: 'ESCANEAR', left: 437, top: 1020, fontSize: 10, fill: '#64748b', originX: 'center', data: { type: 'qr-label' } }
        ],
        layouts: {
            landscape: [
                { type: 'rect', left: 561.5, top: 397, width: 1123, height: 794, fill: '#f8fafc', originX: 'center', originY: 'center', selectable: false, data: { type: 'background-main' } },
                { type: 'rect', left: 40, top: 397, width: 80, height: 794, fill: '#1e293b', originX: 'center', originY: 'center', data: { type: 'sidebar-left' } },
                { type: 'rect', left: 601.5, top: 20, width: 1043, height: 40, fill: '#3b82f6', originX: 'center', originY: 'center', data: { type: 'header-bar' } },
                { type: 'circle', left: 40, top: 60, radius: 25, fill: '#3b82f6', originX: 'center', originY: 'center', data: { type: 'logo-bg' } },
                { type: 'i-text', text: 'AC', left: 40, top: 70, fontSize: 18, fontFamily: 'Inter', fill: '#ffffff', originX: 'center', fontWeight: 'bold', data: { type: 'logo-text' } },
                { type: 'i-text', text: 'AcademicChain Ledger', left: 601.5, top: 100, fontSize: 16, fontFamily: 'Inter', fill: '#334155', originX: 'center', fontWeight: 'bold', letterSpacing: 2, data: { type: 'institution-name' } },
                { type: 'i-text', text: 'CERTIFICADO DE FINALIZACIÓN', left: 601.5, top: 150, fontSize: 32, fontFamily: 'Inter', fill: '#334155', originX: 'center', letterSpacing: 4, fontWeight: 'bold', textAlign: 'center', width: 800, data: { type: 'title-main' } },
                { type: 'i-text', text: 'Este documento certifica que', left: 601.5, top: 220, fontSize: 18, fontFamily: 'Inter', fill: '#64748b', originX: 'center', data: { type: 'text-intro' } },
                { type: 'i-text', text: '{{STUDENT_NAME}}', left: 601.5, top: 300, fontSize: 40, fontFamily: 'Inter', fill: '#0f172a', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 800, data: { type: 'student-name', isSmart: true } },
                { type: 'rect', left: 601.5, top: 340, width: 400, height: 2, fill: '#cbd5e1', originX: 'center', originY: 'center', data: { type: 'separator-line' } },
                { type: 'i-text', text: 'ha completado con éxito el programa de', left: 601.5, top: 390, fontSize: 18, fontFamily: 'Inter', fill: '#64748b', originX: 'center', textAlign: 'center', width: 800, data: { type: 'text-body' } },
                { type: 'i-text', text: '{{DEGREE}}', left: 601.5, top: 450, fontSize: 32, fontFamily: 'Inter', fill: '#2563eb', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 800, data: { type: 'degree-name', isSmart: true } },
                { type: 'rect', left: 601.5, top: 600, width: 200, height: 1, fill: '#000000', originX: 'center', originY: 'center', data: { type: 'sig-line' } },
                { type: 'i-text', text: 'Director Académico', left: 601.5, top: 620, fontSize: 14, fontFamily: 'Inter', fill: '#64748b', originX: 'center', data: { type: 'sig-text' } },
                { type: 'i-text', text: 'Fecha de Emisión: 01/01/2026', left: 120, top: 750, fontSize: 12, fontFamily: 'Inter', fill: '#64748b', originX: 'left', data: { type: 'text-footer-1' } },
                { type: 'i-text', text: 'Credencial ID: {{TOKEN_ID}}', left: 120, top: 770, fontSize: 12, fontFamily: 'Inter', fill: '#64748b', originX: 'left', data: { type: 'text-footer-2' } },
                { type: 'rect', left: 601.5, top: 680, width: 110, height: 110, fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 2, originX: 'center', originY: 'center', data: { type: 'qr-bg' } },
                { type: 'image', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/200px-QR_code_for_mobile_English_Wikipedia.svg.png', left: 601.5, top: 680, width: 100, height: 100, originX: 'center', originY: 'center', crossOrigin: 'anonymous', data: { type: 'qr-placeholder', name: 'QR Code', isQR: true } },
                { type: 'i-text', text: 'ESCANEAR', left: 601.5, top: 750, fontSize: 10, fill: '#64748b', originX: 'center', data: { type: 'qr-label' } }
            ]
        }
    },
    {
        id: 'blockchain',
        name: 'Blockchain Elite [Multi-Chain]',
        category: 'Sovereign',
        tags: ['crypto', 'purple', 'border'],
        thumbnail: 'bg-white border-2 border-purple-500',
        bg: '#ffffff',
        pageSize: 'Portrait',
        objects: [
            // Background Circuit Lines
            { type: 'line', x1: 0, y1: 561.5, x2: 794, y2: 561.5, stroke: '#f3e8ff', strokeWidth: 1, originX: 'center', originY: 'center', data: { type: 'bg-line-h' } },
            { type: 'line', x1: 397, y1: 0, x2: 397, y2: 1123, stroke: '#f3e8ff', strokeWidth: 1, originX: 'center', originY: 'center', data: { type: 'bg-line-v' } },
            { type: 'circle', left: 397, top: 561.5, radius: 250, fill: 'transparent', stroke: '#f3e8ff', strokeWidth: 1, originX: 'center', originY: 'center', data: { type: 'bg-circle' } },

            // Tech Corners (Smart Anchors)
            { type: 'rect', left: 40, top: 40, width: 80, height: 6, fill: '#7c3aed', originX: 'left', originY: 'top', data: { type: 'corner-tl-h' } },
            { type: 'rect', left: 40, top: 40, width: 6, height: 80, fill: '#7c3aed', originX: 'left', originY: 'top', data: { type: 'corner-tl-v' } },
            
            { type: 'rect', left: 754, top: 40, width: 80, height: 6, fill: '#7c3aed', originX: 'right', originY: 'top', data: { type: 'corner-tr-h' } },
            { type: 'rect', left: 754, top: 40, width: 6, height: 80, fill: '#7c3aed', originX: 'right', originY: 'top', data: { type: 'corner-tr-v' } },
            
            { type: 'rect', left: 40, top: 1083, width: 80, height: 6, fill: '#7c3aed', originX: 'left', originY: 'bottom', data: { type: 'corner-bl-h' } },
            { type: 'rect', left: 40, top: 1083, width: 6, height: 80, fill: '#7c3aed', originX: 'left', originY: 'bottom', data: { type: 'corner-bl-v' } },
            
            { type: 'rect', left: 754, top: 1083, width: 80, height: 6, fill: '#7c3aed', originX: 'right', originY: 'bottom', data: { type: 'corner-br-h' } },
            { type: 'rect', left: 754, top: 1083, width: 6, height: 80, fill: '#7c3aed', originX: 'right', originY: 'bottom', data: { type: 'corner-br-v' } },

            // Header Box
            { type: 'rect', left: 397, top: 120, width: 500, height: 60, fill: '#f5f3ff', originX: 'center', originY: 'center', data: { type: 'header-bg' } },
            { type: 'i-text', text: 'CREDENCIAL VERIFICADA', left: 397, top: 120, fontSize: 24, fontFamily: 'Orbitron', fill: '#6d28d9', originX: 'center', charSpacing: 10, fontWeight: 'bold', data: { type: 'title-main' } },
            
            // Institution Name
            { type: 'i-text', text: 'AcademicChain Ledger', left: 397, top: 80, fontSize: 18, fontFamily: 'Orbitron', fill: '#7c3aed', originX: 'center', fontWeight: 'bold', letterSpacing: 2, data: { type: 'institution-name' } },
            
            // Main Text
            { type: 'i-text', text: 'Esto certifica que la identidad digital de', left: 397, top: 220, fontSize: 16, fontFamily: 'Inter', fill: '#64748b', originX: 'center', textAlign: 'center', width: 600, data: { type: 'text-intro' } },
            
            { type: 'i-text', text: '{{STUDENT_NAME}}', left: 397, top: 300, fontSize: 48, fontFamily: 'Inter', fill: '#1e293b', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 600, data: { type: 'student-name', isSmart: true } },
            
            { type: 'i-text', text: 'ha sido registrada permanentemente en el libro mayor para', left: 397, top: 380, fontSize: 16, fontFamily: 'Inter', fill: '#64748b', originX: 'center', textAlign: 'center', width: 600, data: { type: 'text-body' } },
            
            { type: 'i-text', text: '{{DEGREE}}', left: 397, top: 460, fontSize: 32, fontFamily: 'Orbitron', fill: '#4c1d95', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 600, data: { type: 'degree-name', isSmart: true } },

            // Nodes / Decor
            { type: 'circle', left: 100, top: 561.5, radius: 5, fill: '#a78bfa', originX: 'center', originY: 'center', data: { type: 'node-left' } },
            { type: 'circle', left: 694, top: 561.5, radius: 5, fill: '#a78bfa', originX: 'center', originY: 'center', data: { type: 'node-right' } },

            // Signatures (Side by side fits in Portrait if small, or stacked)
            { type: 'rect', left: 200, top: 850, width: 180, height: 2, fill: '#cbd5e1', originX: 'center', originY: 'center', data: { type: 'sig-line-1' } },
            { type: 'i-text', text: 'Auditor Smart Contract', left: 200, top: 870, fontSize: 12, fontFamily: 'Inter', fill: '#64748b', originX: 'center', width: 180, textAlign: 'center', data: { type: 'sig-text-1' } },
            
            { type: 'rect', left: 594, top: 850, width: 180, height: 2, fill: '#cbd5e1', originX: 'center', originY: 'center', data: { type: 'sig-line-2' } },
            { type: 'i-text', text: 'Validador Institucional', left: 594, top: 870, fontSize: 12, fontFamily: 'Inter', fill: '#64748b', originX: 'center', width: 180, textAlign: 'center', data: { type: 'sig-text-2' } },

            // QR Code Area - Bottom Center
            { type: 'rect', left: 397, top: 980, width: 110, height: 110, fill: '#ffffff', stroke: '#7c3aed', strokeWidth: 2, originX: 'center', originY: 'center', data: { type: 'qr-bg' } },
            { type: 'image', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/200px-QR_code_for_mobile_English_Wikipedia.svg.png', left: 397, top: 980, width: 100, height: 100, originX: 'center', originY: 'center', crossOrigin: 'anonymous', data: { type: 'qr-placeholder', name: 'QR Code', isQR: true } },
            { type: 'i-text', text: 'VERIFICAR', left: 397, top: 1050, fontSize: 12, fontFamily: 'Orbitron', fill: '#7c3aed', originX: 'center', fontWeight: 'bold', data: { type: 'qr-label' } },
            
            // Footer Text
            { type: 'i-text', text: 'Asegurado por Hedera Hashgraph & XRP Ledger | Bloque #129384', left: 397, top: 1100, fontSize: 10, fontFamily: 'Courier New', fill: '#94a3b8', originX: 'center', data: { type: 'text-footer' } }
        ],
        layouts: {
            landscape: [
                { type: 'rect', left: 561.5, top: 397, width: 1123, height: 794, fill: '#ffffff', originX: 'center', originY: 'center', selectable: false, data: { type: 'background-main' } },
                { type: 'rect', left: 561.5, top: 397, width: 1083, height: 754, fill: 'transparent', stroke: '#8b5cf6', strokeWidth: 4, originX: 'center', originY: 'center', data: { type: 'border-outer' } },
                { type: 'i-text', text: 'AcademicChain Ledger', left: 561.5, top: 100, fontSize: 24, fontFamily: 'Orbitron', fill: '#4c1d95', originX: 'center', fontWeight: 'bold', letterSpacing: 4, data: { type: 'institution-name' } },
                { type: 'i-text', text: 'Esto certifica que la identidad digital de', left: 561.5, top: 220, fontSize: 16, fontFamily: 'Inter', fill: '#64748b', originX: 'center', textAlign: 'center', width: 800, data: { type: 'text-intro' } },
                { type: 'i-text', text: '{{STUDENT_NAME}}', left: 561.5, top: 300, fontSize: 48, fontFamily: 'Inter', fill: '#1e293b', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 800, data: { type: 'student-name', isSmart: true } },
                { type: 'i-text', text: 'ha sido registrada permanentemente en el libro mayor para', left: 561.5, top: 380, fontSize: 16, fontFamily: 'Inter', fill: '#64748b', originX: 'center', textAlign: 'center', width: 800, data: { type: 'text-body' } },
                { type: 'i-text', text: '{{DEGREE}}', left: 561.5, top: 460, fontSize: 32, fontFamily: 'Orbitron', fill: '#4c1d95', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 800, data: { type: 'degree-name', isSmart: true } },
                { type: 'circle', left: 200, top: 397, radius: 5, fill: '#a78bfa', originX: 'center', originY: 'center', data: { type: 'node-left' } },
                { type: 'circle', left: 923, top: 397, radius: 5, fill: '#a78bfa', originX: 'center', originY: 'center', data: { type: 'node-right' } },
                { type: 'rect', left: 280, top: 600, width: 200, height: 2, fill: '#cbd5e1', originX: 'center', originY: 'center', data: { type: 'sig-line-1' } },
                { type: 'i-text', text: 'Auditor Smart Contract', left: 280, top: 620, fontSize: 12, fontFamily: 'Inter', fill: '#64748b', originX: 'center', width: 200, textAlign: 'center', data: { type: 'sig-text-1' } },
                { type: 'rect', left: 843, top: 600, width: 200, height: 2, fill: '#cbd5e1', originX: 'center', originY: 'center', data: { type: 'sig-line-2' } },
                { type: 'i-text', text: 'Validador Institucional', left: 843, top: 620, fontSize: 12, fontFamily: 'Inter', fill: '#64748b', originX: 'center', width: 200, textAlign: 'center', data: { type: 'sig-text-2' } },
                { type: 'rect', left: 561.5, top: 680, width: 110, height: 110, fill: '#ffffff', stroke: '#7c3aed', strokeWidth: 2, originX: 'center', originY: 'center', data: { type: 'qr-bg' } },
                { type: 'image', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/200px-QR_code_for_mobile_English_Wikipedia.svg.png', left: 561.5, top: 680, width: 100, height: 100, originX: 'center', originY: 'center', crossOrigin: 'anonymous', data: { type: 'qr-placeholder', name: 'QR Code', isQR: true } },
                { type: 'i-text', text: 'VERIFICAR', left: 561.5, top: 750, fontSize: 12, fontFamily: 'Orbitron', fill: '#7c3aed', originX: 'center', fontWeight: 'bold', data: { type: 'qr-label' } },
                { type: 'i-text', text: 'Asegurado por Hedera Hashgraph & XRP Ledger | Bloque #129384', left: 561.5, top: 780, fontSize: 10, fontFamily: 'Courier New', fill: '#94a3b8', originX: 'center', data: { type: 'text-footer' } }
            ]
        }
    },
    {
        id: 'holographic-1',
        name: 'Holographic Future [NFT Mode]',
        category: 'Holographic',
        tags: ['neon', 'dark', 'cyber'],
        thumbnail: 'bg-slate-900 border border-cyan-400',
        bg: '#020617',
        pageSize: 'Portrait',
        objects: [
            // Background Grid (Full A4 Portrait)
            { type: 'rect', left: 397, top: 561.5, width: 754, height: 1083, fill: 'transparent', stroke: '#1e293b', strokeWidth: 1, originX: 'center', originY: 'center', data: { type: 'grid-border' } },
            
            // Glowing Frame
            { type: 'rect', left: 397, top: 561.5, width: 720, height: 1050, fill: 'transparent', stroke: '#06b6d4', strokeWidth: 3, shadow: { color: '#06b6d4', blur: 20 }, originX: 'center', originY: 'center', data: { type: 'glow-border' } },
            
            // Corner Brackets
            { type: 'polyline', points: [{x:0, y:50}, {x:0, y:0}, {x:50, y:0}], left: 70, top: 70, fill: 'transparent', stroke: '#22d3ee', strokeWidth: 4, originX: 'center', originY: 'center', data: { type: 'corner-tl' } },
            { type: 'polyline', points: [{x:0, y:50}, {x:0, y:0}, {x:50, y:0}], left: 724, top: 70, fill: 'transparent', stroke: '#22d3ee', strokeWidth: 4, originX: 'center', originY: 'center', angle: 90, data: { type: 'corner-tr' } },
            { type: 'polyline', points: [{x:0, y:50}, {x:0, y:0}, {x:50, y:0}], left: 70, top: 1053, fill: 'transparent', stroke: '#22d3ee', strokeWidth: 4, originX: 'center', originY: 'center', angle: -90, data: { type: 'corner-bl' } },
            { type: 'polyline', points: [{x:0, y:50}, {x:0, y:0}, {x:50, y:0}], left: 724, top: 1053, fill: 'transparent', stroke: '#22d3ee', strokeWidth: 4, originX: 'center', originY: 'center', angle: 180, data: { type: 'corner-br' } },

            // Title
            { type: 'i-text', text: 'CERTIFICADO DIGITAL', left: 397, top: 150, fontSize: 36, fontFamily: 'Orbitron', fill: '#ffffff', originX: 'center', shadow: { color: '#06b6d4', blur: 10 }, data: { type: 'title-main' } },
            
            // Institution
            { type: 'i-text', text: 'AcademicChain Ledger', left: 397, top: 100, fontSize: 20, fontFamily: 'Orbitron', fill: '#22d3ee', originX: 'center', letterSpacing: 4, data: { type: 'institution-name' } },
            
            // Student
            { type: 'i-text', text: '{{STUDENT_NAME}}', left: 397, top: 350, fontSize: 52, fontFamily: 'Orbitron', fill: '#e2e8f0', originX: 'center', fontWeight: 'bold', shadow: { color: '#ffffff', blur: 5 }, data: { type: 'student-name', isSmart: true } },
            
            // Body
            { type: 'i-text', text: 'Ha completado los requisitos para obtener:', left: 397, top: 280, fontSize: 16, fontFamily: 'Inter', fill: '#94a3b8', originX: 'center', data: { type: 'text-intro' } },
            
            { type: 'i-text', text: '{{DEGREE}}', left: 397, top: 500, fontSize: 32, fontFamily: 'Orbitron', fill: '#22d3ee', originX: 'center', textAlign: 'center', width: 600, data: { type: 'degree-name', isSmart: true } },
            
            // Holographic Elements
            { type: 'circle', left: 397, top: 561.5, radius: 150, fill: 'transparent', stroke: '#06b6d4', strokeWidth: 1, opacity: 0.3, originX: 'center', originY: 'center', data: { type: 'holo-circle' } },
            { type: 'rect', left: 397, top: 800, width: 200, height: 2, fill: '#06b6d4', originX: 'center', originY: 'center', shadow: { color: '#06b6d4', blur: 10 }, data: { type: 'sig-line' } },
            { type: 'i-text', text: 'Firma Digital Autorizada', left: 397, top: 820, fontSize: 12, fontFamily: 'Orbitron', fill: '#64748b', originX: 'center', data: { type: 'sig-text' } },
            
            // QR
            { type: 'rect', left: 397, top: 950, width: 110, height: 110, fill: '#0f172a', stroke: '#06b6d4', strokeWidth: 2, originX: 'center', originY: 'center', data: { type: 'qr-bg' } },
            { type: 'image', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/200px-QR_code_for_mobile_English_Wikipedia.svg.png', left: 397, top: 950, width: 100, height: 100, originX: 'center', originY: 'center', crossOrigin: 'anonymous', data: { type: 'qr-placeholder', name: 'QR Code', isQR: true } }
        ],
        layouts: {
            landscape: [
                 { type: 'rect', left: 561.5, top: 397, width: 1123, height: 794, fill: '#020617', originX: 'center', originY: 'center', selectable: false, data: { type: 'background-main' } },
                 { type: 'rect', left: 561.5, top: 397, width: 1083, height: 754, fill: 'transparent', stroke: '#06b6d4', strokeWidth: 3, shadow: { color: '#06b6d4', blur: 20 }, originX: 'center', originY: 'center', data: { type: 'glow-border' } },
                 { type: 'i-text', text: 'CERTIFICADO DIGITAL', left: 561.5, top: 150, fontSize: 36, fontFamily: 'Orbitron', fill: '#ffffff', originX: 'center', shadow: { color: '#06b6d4', blur: 10 }, data: { type: 'title-main' } },
                 { type: 'i-text', text: 'AcademicChain Ledger', left: 561.5, top: 100, fontSize: 20, fontFamily: 'Orbitron', fill: '#22d3ee', originX: 'center', letterSpacing: 4, data: { type: 'institution-name' } },
                 { type: 'i-text', text: '{{STUDENT_NAME}}', left: 561.5, top: 350, fontSize: 52, fontFamily: 'Orbitron', fill: '#e2e8f0', originX: 'center', fontWeight: 'bold', shadow: { color: '#ffffff', blur: 5 }, data: { type: 'student-name', isSmart: true } },
                 { type: 'i-text', text: 'Ha completado los requisitos para obtener:', left: 561.5, top: 280, fontSize: 16, fontFamily: 'Inter', fill: '#94a3b8', originX: 'center', data: { type: 'text-intro' } },
                 { type: 'i-text', text: '{{DEGREE}}', left: 561.5, top: 500, fontSize: 32, fontFamily: 'Orbitron', fill: '#22d3ee', originX: 'center', textAlign: 'center', width: 800, data: { type: 'degree-name', isSmart: true } },
                 { type: 'circle', left: 561.5, top: 397, radius: 150, fill: 'transparent', stroke: '#06b6d4', strokeWidth: 1, opacity: 0.3, originX: 'center', originY: 'center', data: { type: 'holo-circle' } },
                 { type: 'rect', left: 561.5, top: 600, width: 200, height: 2, fill: '#06b6d4', originX: 'center', originY: 'center', shadow: { color: '#06b6d4', blur: 10 }, data: { type: 'sig-line' } },
                 { type: 'i-text', text: 'Firma Digital Autorizada', left: 561.5, top: 620, fontSize: 12, fontFamily: 'Orbitron', fill: '#64748b', originX: 'center', data: { type: 'sig-text' } },
                 { type: 'rect', left: 561.5, top: 680, width: 110, height: 110, fill: '#0f172a', stroke: '#06b6d4', strokeWidth: 2, originX: 'center', originY: 'center', data: { type: 'qr-bg' } },
                 { type: 'image', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/200px-QR_code_for_mobile_English_Wikipedia.svg.png', left: 561.5, top: 680, width: 100, height: 100, originX: 'center', originY: 'center', crossOrigin: 'anonymous', data: { type: 'qr-placeholder', name: 'QR Code', isQR: true } }
            ]
        }
    }
];
