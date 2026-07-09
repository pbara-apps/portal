/**
 * Shared types for PBA Royal Ambassadors website
 */

export interface Executive {
  id: string;
  name: string;
  position: string;
  church: string;
  image?: string | null;
  bio?: string;
}

export interface PastOfficer {
  id: string;
  name: string;
  post: string;
  yearStart: number;
  yearEnd: number;
  status: "Completed" | "Active";
}

export interface Patron {
  id: string;
  name: string;
  role: string;
  image?: string;
  quote: string;
  description?: string;
}

export interface Chapter {
  id: string;
  chapterName: string;
  churchName: string;
  image?: string;
  commander: string;
  unit: "general" | "junior" | "senior";
  status: "active" | "inactive";
}

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image?: string;
  readTime?: number;
  author?: string;
  slug?: string;
}

export interface NewsDetail extends NewsItem {
  content: string;
}

export interface EventItem {
  id: string;
  title: string;
  category: string;
  date: string;
  endDate?: string | null;
  venue: string;
  description: string;
  image?: string;
  status: string;
  isPast: boolean;
}

export interface HeroStat {
  end: number;
  label: string;
  suffix: string;
}

export interface DownloadItem {
  id: string;
  title: string;
  description: string;
  fileType: string;
  fileUrl: string;
  icon: string;
}
