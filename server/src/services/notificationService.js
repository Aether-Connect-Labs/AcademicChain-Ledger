const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.transporter = null;
  }
  async init() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return false;
    this.transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    return true;
  }
  async sendEmail(to, subject, text) {
    if (!this.transporter) {
      const ok = await this.init();
      if (!ok) return { success: false };
    }
    const from = process.env.SMTP_FROM || `no-reply@${(process.env.SERVER_URL || '').replace(/^https?:\/\//,'')}`;
    const info = await this.transporter.sendMail({ from, to, subject, text });
    return { success: true, id: info.messageId };
  }
  getAdminRecipients() {
    const list = [];
    const admin = (process.env.ADMIN_EMAIL || '').trim();
    if (admin) list.push(admin);
    const alerts = String(process.env.ALERT_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    for (const e of alerts) if (e && !list.includes(e)) list.push(e);
    return list;
  }
  async sendAlert(subject, text) {
    const recipients = this.getAdminRecipients();
    if (!recipients.length) return { success: false };
    const ok = await this.init();
    if (!ok) return { success: false };
    const from = process.env.SMTP_FROM || `no-reply@${(process.env.SERVER_URL || '').replace(/^https?:\/\//,'')}`;
    const sent = [];
    for (const to of recipients) {
      try {
        const info = await this.transporter.sendMail({ from, to, subject, text });
        sent.push({ to, id: info.messageId });
      } catch {}
    }
    return { success: sent.length > 0, results: sent };
  }
  async sendWelcomeEmail(institution, tempPassword, planName) {
    const ok = await this.init();
    if (!ok) return { success: false };
    const to = institution?.email;
    if (!to) return { success: false };
    const subject = '🎓 ¡Bienvenido a AcademicChain Ledger! Tu portal institucional está listo';
    const dashboardUrl = String(process.env.CLIENT_URL || 'https://academic-chain-ledger.vercel.app') + '/login';
    const aclTokenId = String(process.env.ACL_TOKEN_ID || '0.0.7560139');
    const treasuryAccountId = String(process.env.TREASURY_ACCOUNT_ID || '0.0.7174400');
    const instName = institution?.universityName || institution?.name || 'Tu Institución';
    const plan = planName || 'Starter';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; background: #0b1224; color: #ffffff;">
        <h2 style="color: #ffffff;">🎓 ¡Bienvenido a AcademicChain Ledger!</h2>
        <p>Hola <strong>${instName}</strong>,</p>
        <p>Es un placer informarte que tu cuenta ha sido activada con éxito. Ahora formas parte de la red de confianza de Aether Connect Labs.</p>
        <div style="background: #111936; padding: 12px 16px; border-radius: 8px; border: 1px solid #1f2a4a;">
          <p style="margin: 0;"><strong>Plan:</strong> ${plan}</p>
          <p style="margin: 0;"><strong>Dashboard:</strong> <a href="${dashboardUrl}" style="color: #7dd3fc;">${dashboardUrl}</a></p>
          ${tempPassword ? `<p style="margin: 0;"><strong>Credenciales temporales:</strong> Email: ${to} · Password: ${tempPassword}</p>` : ''}
        </div>
        <div style="margin-top: 16px;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #22c55e; color: #0b1224; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ir al Dashboard</a>
        </div>
        <h3 style="margin-top: 24px; color: #ffffff;">Tus primeros pasos</h3>
        <ol style="padding-left: 18px;">
          <li><strong>Asociar Token ACL:</strong> Entra a tu dashboard y pulsa el botón de asociación para habilitar los pagos. Token ACL: ${aclTokenId}</li>
          <li><strong>Cargar Créditos:</strong> Envía tus tokens ACL a la tesorería ${treasuryAccountId} para activar tu capacidad de emisión.</li>
          <li><strong>Emitir Certificados:</strong> Sube tus primeros títulos en PDF y dales validez inmutable en segundos.</li>
        </ol>
        <p>Este es un sistema de emisión Gasless: tú te encargas de los títulos, nosotros de la infraestructura.</p>
        <p style="color:#94a3b8;">Si no solicitaste esta activación, responde a este correo para bloquear el acceso.</p>
      </div>
    `;
    const from = process.env.SMTP_FROM || `no-reply@${(process.env.SERVER_URL || '').replace(/^https?:\/\//,'')}`;
    try {
      const info = await this.transporter.sendMail({ from, to, subject, html });
      return { success: true, id: info.messageId };
    } catch {
      return { success: false };
    }
  }
}

module.exports = new NotificationService();
