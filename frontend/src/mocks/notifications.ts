import { NotificationItem } from './types';

/** Notifications come from `/notifications` API. */
export const mockNotifications: NotificationItem[] = [];

export function getUnreadNotificationCount(): number {
  return mockNotifications.filter((n) => !n.read).length;
}
