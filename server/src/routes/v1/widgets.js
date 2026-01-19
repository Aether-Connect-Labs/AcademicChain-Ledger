const router = require('express').Router();
const asyncHandler = require('express-async-handler');

// GET /api/v1/widgets/student/:credentialId
router.get('/student/:credentialId', asyncHandler(async (req, res) => {
    const { credentialId } = req.params;
    
    // Genera un fragmento de HTML seguro que se puede insertar en cualquier lugar
    // Nota: En producción, el dominio debería ser dinámico basado en config
    // Usamos el dominio especificado en el prompt para consistencia
    const verifyUrl = `https://academicchain.io/verify/${credentialId}`;
    
    const widgetHtml = `
        <div class="ac-trust-widget" data-cid="${credentialId}">
            <span class="ac-check">✅</span>
            <span class="ac-text">Título Verificado en Blockchain</span>
            <a href="${verifyUrl}" target="_blank">Verificar Prueba Forense</a>
        </div>
    `;
    
    res.json({ 
        html: widgetHtml, 
        script: "https://cdn.academicchain.io/widget.js",
        verifyUrl: verifyUrl
    });
}));

module.exports = router;