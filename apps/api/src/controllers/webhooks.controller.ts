import { Request, Response } from 'express';
import { injectable } from 'inversify';
import { controller, httpPost } from 'inversify-express-utils';
import crypto from 'crypto';

@controller('/webhooks')
export class WebhooksController {
  @httpPost('/lms/:institutionId')
  async handleLMSWebhook(req: Request, res: Response) {
    // 1. Verificar firma
    const signature = req.headers['x-lms-signature'];
    const isValid = this.verifySignature(
      req.body,
      signature as string,
      process.env.LMS_WEBHOOK_SECRET!
    );
    
    if (!isValid) {
      return res.status(401).send('Invalid signature');
    }

    // 2. Procesar evento
    const event = req.body.event;
    const institutionId = req.params.institutionId;
    
    try {
      switch (event.type) {
        case 'course_completed':
          await this.handleCourseCompletion(event.data, institutionId);
          break;
        case 'grade_submitted':
          await this.handleGradeSubmission(event.data, institutionId);
          break;
        default:
          console.warn('Unhandled event type:', event.type);
      }
      
      res.status(200).send('Webhook processed');
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Error processing webhook');
    }
  }

  private verifySignature(payload: any, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(JSON.stringify(payload)).digest('hex');
    return digest === signature;
  }

  private async handleCourseCompletion(data: any, institutionId: string) {
    // Lógica para manejar completación de curso
  }

  private async handleGradeSubmission(data: any, institutionId: string) {
    // Lógica para manejar envío de calificaciones
  }
}