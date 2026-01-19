const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const creatorService = require('../services/creatorService');
const { protect, requireRole } = require('../middleware/auth');
const { generateApiKey } = require('../services/apiKeyService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/creators/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, JPG, PNG, GIF, SVG)'));
    }
  }
});

// All routes in this file are protected and require a valid token
router.use(protect);

// Get creator profile
router.get('/profile', requireRole('CREATOR'), async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await creatorService.getCreatorProfile(userId);
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting creator profile:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener perfil del creador'
    });
  }
});

// Update creator profile
router.put('/profile', requireRole('CREATOR'),
  [
    body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('brand').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('bio').optional().isString().trim().isLength({ max: 500 }),
    body('website').optional().isURL()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const profileData = req.body;
      const updatedProfile = await creatorService.updateCreatorProfile(userId, profileData);
      
      res.json({
        success: true,
        data: updatedProfile
      });
    } catch (error) {
      console.error('Error updating creator profile:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar perfil del creador'
      });
    }
  }
);

// Upload creator signature
router.post('/profile/signature', requireRole('CREATOR'),
  upload.single('signature'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó archivo de firma'
        });
      }

      const userId = req.user.id;
      const signatureUrl = `/uploads/creators/${req.file.filename}`;
      
      const updatedProfile = await creatorService.updateCreatorProfile(userId, {
        signature: signatureUrl
      });
      
      res.json({
        success: true,
        data: updatedProfile,
        message: 'Firma digital cargada exitosamente'
      });
    } catch (error) {
      console.error('Error uploading signature:', error);
      res.status(500).json({
        success: false,
        error: 'Error al cargar firma digital'
      });
    }
  }
);

// Upload creator logo
router.post('/profile/logo', requireRole('CREATOR'),
  upload.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó archivo de logo'
        });
      }

      const userId = req.user.id;
      const logoUrl = `/uploads/creators/${req.file.filename}`;
      
      const updatedProfile = await creatorService.updateCreatorProfile(userId, {
        logo: logoUrl
      });
      
      res.json({
        success: true,
        data: updatedProfile,
        message: 'Logo de marca cargado exitosamente'
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({
        success: false,
        error: 'Error al cargar logo de marca'
      });
    }
  }
);

// Generate new API Key for creator
router.post('/api-key', requireRole('CREATOR'), async (req, res) => {
  try {
    const userId = req.user.id;
    const apiKey = await generateApiKey(userId, 'CREATOR');
    
    // Store API key in creator profile
    await creatorService.updateCreatorApiKey(userId, apiKey);
    
    res.json({
      success: true,
      data: {
        apiKey,
        message: 'API Key generada exitosamente'
      }
    });
  } catch (error) {
    console.error('Error generating creator API key:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar API Key'
    });
  }
});

// Get creator credentials (issued by this creator)
router.get('/credentials', requireRole('CREATOR'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, sort = 'desc' } = req.query;
    
    const credentials = await creatorService.getCreatorCredentials(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    });
    
    res.json({
      success: true,
      data: credentials.items,
      pagination: {
        total: credentials.total,
        page: credentials.page,
        pages: credentials.pages,
        limit: credentials.limit
      }
    });
  } catch (error) {
    console.error('Error getting creator credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener credenciales del creador'
    });
  }
});

// Issue credential as creator (EliteProof flow)
router.post('/issue',
  [
    body('studentName').isString().trim().isLength({ min: 2, max: 100 }),
    body('studentEmail').isEmail().normalizeEmail(),
    body('credentialType').isIn(['course', 'workshop', 'bootcamp', 'mentorship']),
    body('title').isString().trim().isLength({ min: 2, max: 200 }),
    body('description').optional().isString().trim().isLength({ max: 500 }),
    body('issueDate').isISO8601(),
    body('expiryDate').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const credentialData = req.body;
      
      // Issue credential using EliteProof flow
      const result = await creatorService.issueCreatorCredential(userId, credentialData);
      
      res.json({
        success: true,
        data: result,
        message: 'Credencial emitida exitosamente con sello de Mentor Verificado'
      });
    } catch (error) {
      console.error('Error issuing creator credential:', error);
      res.status(500).json({
        success: false,
        error: 'Error al emitir credencial del creador'
      });
    }
  }
);

// Get creator statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await creatorService.getCreatorStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting creator stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas del creador'
    });
  }
});

module.exports = router;