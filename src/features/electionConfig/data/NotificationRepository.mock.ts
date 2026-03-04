// Mock implementation del repositorio de notificaciones
// Simula envío de notificaciones a votantes

export interface NotificationData {
  title: string;
  message: string;
}

export interface Notification extends NotificationData {
  id: string;
  electionId: string;
  createdAt: string;
}

export interface INotificationRepository {
  createNotification(electionId: string, data: NotificationData): Promise<Notification>;
  listNotifications(electionId: string): Promise<Notification[]>;
}

const NOTIFICATIONS_KEY = 'mock_notifications';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class NotificationRepositoryMock implements INotificationRepository {
  private getStoredNotifications(): Notification[] {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }

  async createNotification(electionId: string, data: NotificationData): Promise<Notification> {
    await delay(500 + Math.random() * 500); // Simular latencia

    const notification: Notification = {
      id: `notif-${Date.now()}`,
      electionId,
      title: data.title,
      message: data.message,
      createdAt: new Date().toISOString(),
    };

    const notifications = this.getStoredNotifications();
    notifications.push(notification);
    this.saveNotifications(notifications);

    return notification;
  }

  async listNotifications(electionId: string): Promise<Notification[]> {
    await delay(200);
    const all = this.getStoredNotifications();
    return all.filter(n => n.electionId === electionId);
  }
}

// Singleton para uso global
export const notificationRepository = new NotificationRepositoryMock();
