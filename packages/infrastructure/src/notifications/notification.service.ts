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