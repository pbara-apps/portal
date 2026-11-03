/** An in-app notification (same shape in both portals). */
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationFeed {
  items: AppNotification[];
  unread: number;
}

type RawNotification = Omit<AppNotification, "id"> & { _id: string };

export function mapNotificationFeed(
  raw: { items?: RawNotification[]; unread?: number } | null,
): NotificationFeed {
  return {
    items: (raw?.items ?? []).map(({ _id, ...rest }) => ({ id: _id, ...rest })),
    unread: raw?.unread ?? 0,
  };
}
