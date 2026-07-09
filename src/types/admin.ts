export type ExecutiveStatus = "active" | "inactive" | "completed";
export type ChapterStatus = "active" | "inactive";
export type ExecutiveRole = "super_admin" | "admin" | "editor" | "viewer";

export interface AdminExecutive {
  id: string;
  name: string;
  email: string;
  phone: string;
  officeId: string;
  officeName: string;
  churchId: string;
  chapterName: string;
  churchName: string;
  status: ExecutiveStatus;
  role: ExecutiveRole;
  description: string;
  image?: string | null;
  startYear: number;
  endYear?: number | null;
}

export interface AdminOffice {
  id: string;
  name: string;
  description: string;
}

export interface AdminChapter {
  id: string;
  name: string;
  chapter: string;
  address?: string;
  counsellor?: string;
  status: ChapterStatus;
  image?: string | null;
}

export interface ExecutiveFormPayload {
  name: string;
  email?: string;
  phone: string;
  office_id: string;
  church_id: string;
  start_year: number;
  end_year?: number | null;
  status: ExecutiveStatus;
  description: string;
  image?: string | null;
  password?: string;
  title?: string;
}

export interface OfficeFormPayload {
  name: string;
  description: string;
}

export interface ChapterFormPayload {
  name: string;
  chapter: string;
  address?: string;
  counsellor?: string;
  status: ChapterStatus;
  image?: string | null;
}

export const EXECUTIVE_STATUSES: ExecutiveStatus[] = [
  "active",
  "inactive",
  "completed",
];

export const CHAPTER_STATUSES: ChapterStatus[] = ["active", "inactive"];

export type NewsStatus = "draft" | "published";
export type EventStatus = "open" | "completed" | "cancelled";
export type GalleryStatus = "active" | "inactive";
export type GalleryType = "photo" | "video";

export interface AdminNews {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  image?: string | null;
  author?: string | null;
  readTime: number;
  status: NewsStatus;
  date: string;
}

export interface AdminEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  endDate?: string | null;
  venue: string;
  description: string;
  image?: string | null;
  status: EventStatus;
  isPast: boolean;
}

export interface AdminGalleryItem {
  id: string;
  title: string;
  alt: string;
  url: string;
  type: GalleryType;
  category: string;
  status: GalleryStatus;
  sortOrder: number;
}

export interface AdminAuditEntry {
  id: string;
  action: "created" | "updated" | "deleted";
  entityType: string;
  entityId?: string | null;
  entityTitle: string;
  actorName: string;
  detail?: string | null;
  timestamp: string;
}

export interface NewsFormPayload {
  title: string;
  slug?: string;
  category: string;
  excerpt: string;
  content?: string;
  image?: string | null;
  author?: string | null;
  read_time?: number;
  status?: NewsStatus;
}

export interface EventFormPayload {
  title: string;
  category: string;
  date: string;
  endDate?: string | null;
  venue: string;
  description: string;
  image?: string | null;
  status?: EventStatus;
}

export interface GalleryFormPayload {
  title: string;
  alt?: string;
  url: string;
  type?: GalleryType;
  category?: string;
  status?: GalleryStatus;
  sort_order?: number;
}

export const NEWS_STATUSES: NewsStatus[] = ["draft", "published"];
export const EVENT_STATUSES: EventStatus[] = ["open", "completed", "cancelled"];
export const GALLERY_STATUSES: GalleryStatus[] = ["active", "inactive"];
export const GALLERY_TYPES: GalleryType[] = ["photo", "video"];

export const NEWS_CATEGORIES = [
  "Programs",
  "Press Release",
  "Announcements",
  "Leadership",
  "Events",
  "Featured",
  "Report",
  "Upcoming",
  "Drill & Discipline",
] as const;

export const EVENT_CATEGORIES = [
  "Golden Ambassador",
  "Training",
  "Ceremony",
  "Sports",
  "Outreach",
  "Conference",
] as const;

export interface AdminMessage {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface ContactFormPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}
