export const mockCredentials = {
    studentName: "Estudiante de Prueba",
    courseName: "Carrera Ejemplo",
    issueDate: "01/01/2026",
    tokenId: "0.0.123456",
    university: "Universidad AcademicChain",
    qrCode: "https://academicchain.com/verify/mock"
};

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

            // QR Code Area (Bottom Right or Center)
            { type: 'rect', left: 437, top: 950, width: 120, height: 120, fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 2, originX: 'center', originY: 'center', data: { type: 'qr-bg' } },
            { type: 'i-text', text: 'QR', left: 437, top: 950, fontSize: 24, fill: '#cbd5e1', originX: 'center', fontWeight: 'bold', data: { type: 'qr-placeholder' } },
            { type: 'i-text', text: 'ESCANEAR', left: 437, top: 1000, fontSize: 10, fill: '#64748b', originX: 'center', data: { type: 'qr-label' } }
        ]
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
            { type: 'i-text', text: 'VERIFICAR', left: 397, top: 1050, fontSize: 12, fontFamily: 'Orbitron', fill: '#7c3aed', originX: 'center', fontWeight: 'bold', data: { type: 'qr-label' } },
            
            // Footer Text
            { type: 'i-text', text: 'Asegurado por Hedera Hashgraph & XRP Ledger | Bloque #129384', left: 397, top: 1100, fontSize: 10, fontFamily: 'Courier New', fill: '#94a3b8', originX: 'center', data: { type: 'text-footer' } }
        ]
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
            { type: 'polyline', points: [{x:0, y:50}, {x:0, y:0}, {x:50, y:0}], left: 724, top: 70, angle: 90, fill: 'transparent', stroke: '#22d3ee', strokeWidth: 4, originX: 'center', originY: 'center', data: { type: 'corner-tr' } },
            { type: 'polyline', points: [{x:0, y:50}, {x:0, y:0}, {x:50, y:0}], left: 724, top: 1053, angle: 180, fill: 'transparent', stroke: '#22d3ee', strokeWidth: 4, originX: 'center', originY: 'center', data: { type: 'corner-br' } },
            { type: 'polyline', points: [{x:0, y:50}, {x:0, y:0}, {x:50, y:0}], left: 70, top: 1053, angle: 270, fill: 'transparent', stroke: '#22d3ee', strokeWidth: 4, originX: 'center', originY: 'center', data: { type: 'corner-bl' } },

            // Top HUD
            { type: 'rect', left: 397, top: 80, width: 300, height: 40, fill: '#083344', originX: 'center', originY: 'center', opacity: 0.8, data: { type: 'hud-bg' } },
            { type: 'i-text', text: 'CERTIFICADO DE ACTIVO DIGITAL', left: 397, top: 80, fontSize: 16, fontFamily: 'Orbitron', fill: '#67e8f9', originX: 'center', letterSpacing: 2, fontWeight: 'bold', data: { type: 'title-main' } },

            // Central Data
            { type: 'i-text', text: 'IDENTIDAD CONFIRMADA:', left: 397, top: 220, fontSize: 14, fontFamily: 'Orbitron', fill: '#94a3b8', originX: 'center', letterSpacing: 3, data: { type: 'text-intro' } },
            
            { type: 'i-text', text: '{{STUDENT_NAME}}', left: 397, top: 300, fontSize: 48, fontFamily: 'Inter', fill: '#ffffff', originX: 'center', fontWeight: 'bold', shadow: { color: '#22d3ee', blur: 10 }, textAlign: 'center', width: 600, data: { type: 'student-name', isSmart: true } },
            
            { type: 'i-text', text: 'NIVEL DE ACCESO CONCEDIDO:', left: 397, top: 400, fontSize: 14, fontFamily: 'Orbitron', fill: '#94a3b8', originX: 'center', letterSpacing: 3, data: { type: 'text-body' } },
            
            { type: 'i-text', text: '{{DEGREE}}', left: 397, top: 480, fontSize: 36, fontFamily: 'Orbitron', fill: '#22d3ee', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 600, data: { type: 'degree-name', isSmart: true } },

            // Barcode/Tech lines
            { type: 'rect', left: 100, top: 561.5, width: 4, height: 200, fill: '#1e293b', originX: 'center', originY: 'center', data: { type: 'tech-line-left' } },
            { type: 'rect', left: 694, top: 561.5, width: 4, height: 200, fill: '#1e293b', originX: 'center', originY: 'center', data: { type: 'tech-line-right' } },

            // QR Code Area - Cyber Style (Bottom Center)
            { type: 'rect', left: 397, top: 900, width: 120, height: 120, fill: 'transparent', stroke: '#22d3ee', strokeWidth: 2, originX: 'center', originY: 'center', data: { type: 'qr-bg' } },
            { type: 'rect', left: 397, top: 900, width: 100, height: 100, fill: '#083344', opacity: 0.5, originX: 'center', originY: 'center', data: { type: 'qr-inner' } },
            { type: 'i-text', text: '[ QR ]', left: 397, top: 900, fontSize: 20, fontFamily: 'Orbitron', fill: '#22d3ee', originX: 'center', data: { type: 'qr-placeholder' } },

            // Bottom Code
            { type: 'i-text', text: '0x71C...3A9F | PRUEBA INMUTABLE | ETH-721', left: 397, top: 1000, fontSize: 12, fontFamily: 'JetBrains Mono', fill: '#475569', originX: 'center', data: { type: 'text-footer' } }
        ]
    },
    {
        id: 'gold-standard',
        name: 'Gold Standard',
        category: 'Classic',
        tags: ['diploma', 'gold', 'formal'],
        thumbnail: 'bg-orange-50',
        bg: '#fffbeb',
        pageSize: 'Portrait',
        objects: [
            // Ornate Border System (Portrait Dimensions)
            // 1. Outer Dark
            { type: 'rect', left: 397, top: 561.5, width: 734, height: 1063, fill: 'transparent', stroke: '#451a03', strokeWidth: 4, originX: 'center', originY: 'center', data: { type: 'border-outer' } },
            // 2. Gold Wide
            { type: 'rect', left: 397, top: 561.5, width: 714, height: 1043, fill: 'transparent', stroke: '#d97706', strokeWidth: 15, originX: 'center', originY: 'center', data: { type: 'border-mid' } },
            // 3. Inner Detail
            { type: 'rect', left: 397, top: 561.5, width: 684, height: 1013, fill: 'transparent', stroke: '#451a03', strokeWidth: 2, originX: 'center', originY: 'center', data: { type: 'border-inner' } },

            // Corner Decorations
            { type: 'circle', left: 55, top: 55, radius: 20, fill: '#d97706', originX: 'center', originY: 'center', data: { type: 'corner-tl' } },
            { type: 'circle', left: 739, top: 55, radius: 20, fill: '#d97706', originX: 'center', originY: 'center', data: { type: 'corner-tr' } },
            { type: 'circle', left: 55, top: 1068, radius: 20, fill: '#d97706', originX: 'center', originY: 'center', data: { type: 'corner-bl' } },
            { type: 'circle', left: 739, top: 1068, radius: 20, fill: '#d97706', originX: 'center', originY: 'center', data: { type: 'corner-br' } },

            // Institution Header
            { type: 'i-text', text: 'UNIVERSIDAD ACADEMICCHAIN', left: 397, top: 140, fontSize: 32, fontFamily: 'Times New Roman', fill: '#451a03', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 600, data: { type: 'institution-name' } },
            { type: 'i-text', text: 'Excelencia Académica', left: 397, top: 180, fontSize: 18, fontFamily: 'Times New Roman', fill: '#b45309', originX: 'center', fontStyle: 'italic', data: { type: 'slogan' } },

            // Seal Placeholder (Moved up or keep bottom?) Classic diplomas often have seal at bottom left/center
            { type: 'circle', left: 397, top: 900, radius: 50, fill: 'transparent', stroke: '#d97706', strokeWidth: 3, originX: 'center', originY: 'center', data: { type: 'seal' } },
            { type: 'i-text', text: 'SELLO', left: 397, top: 900, fontSize: 20, fill: '#d97706', originX: 'center', fontWeight: 'bold', data: { type: 'seal-text' } },

            // Main Content
            { type: 'i-text', text: 'DIPLOMA DE HONOR', left: 397, top: 260, fontSize: 48, fontFamily: 'Times New Roman', fill: '#000000', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 600, data: { type: 'title-main' } },
            
            { type: 'i-text', text: 'Por cuanto ha cumplido con los requisitos exigidos por la ley, otorga a:', left: 397, top: 340, fontSize: 18, fontFamily: 'Times New Roman', fill: '#44403c', originX: 'center', fontStyle: 'italic', textAlign: 'center', width: 500, splitByGrapheme: true, data: { type: 'text-intro' } },
            
            { type: 'i-text', text: '{{STUDENT_NAME}}', left: 397, top: 440, fontSize: 48, fontFamily: 'Times New Roman', fill: '#000000', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 600, data: { type: 'student-name', isSmart: true } },
            
            { type: 'i-text', text: 'el título de', left: 397, top: 520, fontSize: 18, fontFamily: 'Times New Roman', fill: '#44403c', originX: 'center', fontStyle: 'italic', data: { type: 'text-body' } },
            
            { type: 'i-text', text: '{{DEGREE}}', left: 397, top: 580, fontSize: 36, fontFamily: 'Times New Roman', fill: '#78350f', originX: 'center', fontWeight: 'bold', textAlign: 'center', width: 600, data: { type: 'degree-name', isSmart: true } },

            // Signatures
            { type: 'rect', left: 200, top: 800, width: 200, height: 2, fill: '#000000', originX: 'center', originY: 'center', data: { type: 'sig-line-1' } },
            { type: 'i-text', text: 'Rector', left: 200, top: 820, fontSize: 16, fontFamily: 'Times New Roman', fill: '#000000', originX: 'center', data: { type: 'sig-text-1' } },

            { type: 'rect', left: 594, top: 800, width: 200, height: 2, fill: '#000000', originX: 'center', originY: 'center', data: { type: 'sig-line-2' } },
            { type: 'i-text', text: 'Secretario General', left: 594, top: 820, fontSize: 16, fontFamily: 'Times New Roman', fill: '#000000', originX: 'center', data: { type: 'sig-text-2' } },

            // QR Code Area (Bottom Left)
            { type: 'rect', left: 100, top: 900, width: 100, height: 100, fill: '#ffffff', stroke: '#451a03', strokeWidth: 1, originX: 'center', originY: 'center', data: { type: 'qr-bg' } },
            { type: 'i-text', text: 'QR', left: 100, top: 900, fontSize: 20, fill: '#451a03', originX: 'center', data: { type: 'qr-placeholder' } }
        ]
    }
];
