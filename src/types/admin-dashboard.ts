export interface DashboardActivityItem {
  id: string;
  kind: string;
  action: string;
  title: string;
  subtitle?: string;
  timestamp: string;
}

export interface AdminDashboardStats {
  totalChapters: number;
  activeChapters: number;
  totalOffices: number;
  totalExecutives: number;
  activeExecutives: number;
  totalNews: number;
  publishedNews: number;
  totalEvents: number;
  upcomingEvents: number;
  totalGallery: number;
  activeGallery: number;
  totalMessages: number;
  unreadMessages: number;
  recentActivity: DashboardActivityItem[];
}
