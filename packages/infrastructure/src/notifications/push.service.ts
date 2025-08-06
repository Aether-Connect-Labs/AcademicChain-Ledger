import { injectable } from 'inversify';
import webPush from 'web-push';

// Placeholder for UserModel - assuming it's a Mongoose model or similar
const UserModel = {
  find: (query: any) => [] as any[] // Placeholder for find
};

interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@injectable()
export class PushNotificationService {
  constructor() {
    webPush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL!}`,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  }

  async sendNotification(
    subscription: PushSubscription,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    const payload = JSON.stringify({
      title,
      body,
      ...data
    });

    await webPush.sendNotification(subscription, payload);
  }

  async broadcastToUsers(
    userIds: string[],
    title: string,
    message: string
  ): Promise<void> {
    const users = await UserModel.find({ _id: { $in: userIds } });
    
    await Promise.all(
      users.map(user => 
        user.pushSubscriptions.map((subscription: PushSubscription) =>
          this.sendNotification(subscription, title, message)
      )
    ));
  }
}