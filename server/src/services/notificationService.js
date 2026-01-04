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
}

module.exports = new NotificationService();
