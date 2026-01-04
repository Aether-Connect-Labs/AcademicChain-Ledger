const express = require('express');
const asyncHandler = require('express-async-handler');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');
const crmService = require('../services/crmService');

const router = express.Router();

// Google Calendar API integration - TEMPORARILY DISABLED
// const { google } = require('googleapis');

function pad(n) { return String(n).padStart(2, '0'); }
function toGoogleDate(dt) {
  const y = dt.getUTCFullYear();
  const m = pad(dt.getUTCMonth() + 1);
  const d = pad(dt.getUTCDate());
  const hh = pad(dt.getUTCHours());
  const mm = pad(dt.getUTCMinutes());
  const ss = pad(dt.getUTCSeconds());
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function buildGoogleCalendarRenderLink(bookingData) {
  const title = `Demo AcademicChain - ${bookingData.org}`;
  const details = `Demo con ${bookingData.name} (${bookingData.email})\\nZona horaria: ${bookingData.tz}`;
  const location = process.env.DEMO_MEET_URL || 'https://meet.google.com/lookup/academicchain-demo';
  const startStr = toGoogleDate(new Date(bookingData.startTime));
  const endStr = toGoogleDate(new Date(bookingData.endTime));
  const dates = `${startStr}/${endStr}`;
  const base = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details,
    location,
    dates
  });
  return `${base}?${params.toString()}`;
}

async function createGoogleCalendarEvent(bookingData) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: `Demo AcademicChain - ${bookingData.name}`,
      description: `Demo programada con ${bookingData.name} de ${bookingData.org}.\nEmail: ${bookingData.email}\nZona horaria: ${bookingData.tz}`,
      start: {
        dateTime: bookingData.startTime,
        timeZone: bookingData.tz
      },
      end: {
        dateTime: bookingData.endTime,
        timeZone: bookingData.tz
      },
      attendees: [
        { email: bookingData.email },
        { email: process.env.ADMIN_EMAIL || 'demo@academicchain.com' }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 24 horas antes
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all'
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink
    };
  } catch (error) {
    logger.error('Google Calendar API Error:', error);
    return { success: false, error: error.message };
  }
}

// Email templates
const getConfirmationEmail = (bookingData, calendarLink = null) => {
  const subject = '✅ Confirmación de Demo - AcademicChain';
  
  const text = `
Hola ${bookingData.name},

Tu demo de AcademicChain ha sido programada exitosamente.

📅 Fecha: ${bookingData.date}
⏰ Hora: ${bookingData.time} (${bookingData.tz})
🏢 Institución: ${bookingData.org}

Enlace de la reunión: ${process.env.DEMO_MEET_URL || 'https://meet.google.com/lookup/academicchain-demo'}

${calendarLink ? `Evento de calendario: ${calendarLink}` : ''}

Si necesitas reprogramar o tienes alguna pregunta, contáctanos en demo@academicchain.com

¡Esperamos con entusiasmo mostrarte nuestra plataforma!

Saludos,
Equipo AcademicChain
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
    .info-item { margin: 10px 0; }
    .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Demo Confirmada</h1>
      <p>AcademicChain - Tu cita está programada</p>
    </div>
    <div class="content">
      <p>Hola <strong>${bookingData.name}</strong>,</p>
      <p>Tu demo de AcademicChain ha sido programada exitosamente.</p>
      
      <div class="info-item">
        <strong>📅 Fecha:</strong> ${bookingData.date}
      </div>
      <div class="info-item">
        <strong>⏰ Hora:</strong> ${bookingData.time} (${bookingData.tz})
      </div>
      <div class="info-item">
        <strong>🏢 Institución:</strong> ${bookingData.org}
      </div>
      
      <p style="margin-top: 20px;">
        <a href="${process.env.DEMO_MEET_URL || 'https://meet.google.com/lookup/academicchain-demo'}" class="button">
          Unirse a la reunión
        </a>
      </p>
      
      ${calendarLink ? `<p><strong>📅 Evento de calendario:</strong> <a href="${calendarLink}">Ver en Google Calendar</a></p>` : ''}
      
      <p>Si necesitas reprogramar o tienes alguna pregunta, contáctanos en <a href="mailto:demo@academicchain.com">demo@academicchain.com</a></p>
      
      <div class="footer">
        <p>Este es un mensaje automático. Por favor no responder directamente a este email.</p>
        <p>© 2024 AcademicChain. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, text, html };
};

router.post('/', [
  body('name').notEmpty().isString().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('org').notEmpty().isString().trim().escape(),
  body('date').notEmpty().isString().trim(),
  body('time').notEmpty().isString().trim(),
  body('tz').notEmpty().isString().trim(),
], validate, asyncHandler(async (req, res) => {
  const { Booking } = require('../models');
  const { isConnected: isMongoConnected } = require('../config/database');
  const { name, email, org, date, time, tz } = req.body;

  try {
    // Calculate start and end times
    const [hours, minutes] = time.split(':').map(Number);
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + 1);

    const bookingData = {
      name,
      email,
      org,
      date,
      time,
      tz,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString()
    };

    // Save to database (fallback to memory when Mongo is disabled/not connected)
    let record;
    const useMem = (process.env.DISABLE_MONGO === '1' || !isMongoConnected());
    if (useMem) {
      record = { _id: { toString: () => `mem-${Date.now()}` } };
    } else {
      record = await Booking.create({ 
        ...bookingData, 
        status: 'confirmed',
        googleEventId: null,
        calendarLink: null
      });
    }

    logger.info(`📅 Nueva demo programada: ${date} ${time} (${tz}) - ${name} - ${org} <${email}>`);

    // Sync to CRM systems (async - don't block response)
    if (crmService.isConfigured()) {
      crmService.syncToCRM(bookingData, record._id.toString())
        .then(crmResult => {
          if (crmResult.success) {
            logger.info(`✅ CRM sync completed for booking ${record._id}: ${crmResult.results.filter(r => r.success).length} successful integrations`);
          } else {
            logger.warn(`⚠️ CRM sync partially failed for booking ${record._id}`);
          }
        })
        .catch(crmError => {
          logger.error('CRM sync error:', crmError);
        });
    }

    // Create Google Calendar event - via render link fallback
    let calendarResult = { success: true, eventId: null, htmlLink: buildGoogleCalendarRenderLink(bookingData) };
    // if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
    //   calendarResult = await createGoogleCalendarEvent(bookingData);
    //   
    //   if (calendarResult.success) {
    //     await Booking.findByIdAndUpdate(record._id, {
    //       googleEventId: calendarResult.eventId,
    //       calendarLink: calendarResult.htmlLink
    //     });
    //   }
    // }
    if (!useMem) {
      try {
        await Booking.findByIdAndUpdate(record._id, {
          googleEventId: calendarResult.eventId,
          calendarLink: calendarResult.htmlLink
        });
      } catch {}
    }

    // Send confirmation email
    const emailContent = getConfirmationEmail(bookingData, calendarResult.htmlLink);
    
    try {
      const emailResult = await notificationService.sendEmail(
        email,
        emailContent.subject,
        emailContent.text
      );
      
      if (emailResult.success) {
        logger.info(`📧 Email de confirmación enviado a: ${email}`);
      }
    } catch (emailError) {
      logger.warn('No se pudo enviar email de confirmación:', emailError);
    }

    // Send notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'demo@academicchain.com';
      await notificationService.sendEmail(
        adminEmail,
        `📅 Nueva demo programada - ${name}`,
        `Nueva demo programada:\n\nNombre: ${name}\nEmail: ${email}\nInstitución: ${org}\nFecha: ${date}\nHora: ${time} (${tz})\n\nGoogle Calendar: ${calendarResult.success ? '✓' : '✗'}`
      );
    } catch (adminEmailError) {
      logger.warn('No se pudo enviar notificación al admin:', adminEmailError);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Demo programada exitosamente', 
      data: { 
        id: record._id,
        calendarEvent: {
          eventId: calendarResult.eventId,
          link: calendarResult.htmlLink
        },
        meetUrl: process.env.DEMO_MEET_URL
      }
    });

  } catch (error) {
    logger.error('Error al programar demo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al programar la demo. Por favor intenta nuevamente.' 
    });
  }
}));

// Endpoint to check CRM integration status
router.get('/crm/status', asyncHandler(async (req, res) => {
  try {
    const providers = crmService.getAvailableProviders();
    const isConfigured = crmService.isConfigured();
    
    res.status(200).json({
      success: true,
      data: {
        configured: isConfigured,
        available_providers: providers,
        providers_count: providers.length,
        environment_configured: {
          hubspot: !!process.env.HUBSPOT_ACCESS_TOKEN,
          salesforce: !!(process.env.SALESFORCE_ACCESS_TOKEN && process.env.SALESFORCE_INSTANCE_URL),
          pipedrive: !!process.env.PIPEDRIVE_API_TOKEN,
          webhook: !!process.env.CRM_WEBHOOK_URL
        }
      }
    });
  } catch (error) {
    logger.error('Error checking CRM status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking CRM integration status'
    });
  }
}));

module.exports = router;
