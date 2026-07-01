export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface User {
  id: string;
  name: string;
  email: string;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface PlatformProfile {
  id: string;
  platform: Platform;
  handle: string;
  displayName: string;
  userId: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  status: PostStatus;
  platformProfileId: string;
  platformProfile?: PlatformProfile;
  scheduledAt: string | null;
  publishedAt: string | null;
  mediaIds: string[];
  media?: Media[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  url: string;
  userId: string;
  createdAt: string;
}

export interface DashboardKpi {
  totalPosts: number;
  publishedThisMonth: number;
  scheduled: number;
  engagementRate: number;
}

export interface PostsByPlatform {
  platform: Platform;
  count: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  platformProfileId: string;
  scheduledAt?: string;
  mediaIds?: string[];
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  platformProfileId?: string;
  scheduledAt?: string | null;
  mediaIds?: string[];
}

export interface CreatePlatformProfileRequest {
  platform: Platform;
  handle: string;
  displayName: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PostFilters {
  search?: string;
  platform?: Platform | '';
  status?: PostStatus | '';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

export const PLATFORM_CHAR_LIMITS: Record<Platform, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
};

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  failed: 'Failed',
};
