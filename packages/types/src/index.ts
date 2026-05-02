// Ortak enum/union tipleri
//frontend ve backend’in ortak kullanacağı TypeScript tiplerini tutuyor.

//API’nin dışarıya verdiği veri şeklinin (endpoint response’ları vs.) tek kaynağı burası; 
//hem apps/api hem apps/web buradan import ediyor.

//Bunları artık hem backend’de hem frontend’de 
//import { UserDTO, TripDTO, ... } from "@pocketguide/types"; şeklinde kullanabilirsin.

export * from './poi';
export * from './offline';
export * from './sync';

export type LanguageCode = "en" | "tr";
export type Theme = "light" | "dark";

// User ile ilgili tipler
export interface UserDTO {
  id: string;
  email: string;
  userName: string;
  studentStatus?: string | null;
  dailyBudgetLimit?: number | null;
  preferredLanguage: LanguageCode | string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettingsDTO {
  id: string;
  userId: string;
  preferredLanguage: LanguageCode | string;
  theme: Theme | string;
  currency: string;
  timezone: string;
  dailyBudgetLimit?: number | null;
  notificationPreferences?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileDTO {
  id: string;
  userId: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  website?: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

// Şehir / yer / gezi ile ilgili tipler
export interface CityDTO {
  id: string;
  slug: string;
  nameEn: string;
  nameTr: string;
  countryCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceDTO {
  id: string;
  name: string;
  city: string;
  cityId?: string | null;
  category: string;
  rating?: number | null;
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  priceLevel?: number | null;
}

export interface TripDTO {
  id: string;
  userId?: string | null;
  cityId: string;
  arrivalPoint?: string | null;
  accommodationArea?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RouteDTO {
  id: string;
  tripId: string;
  routeName: string;
  description?: string | null;
  dayIndex?: number | null;
  durationMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoutePlaceDTO {
  id: string;
  routeId: string;
  placeId: string;
  orderIndex?: number | null;
  stayMinutes?: number | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Sosyal / içerik tarafı tipleri
export interface PostDTO {
  id: string;
  userId: string;
  caption?: string | null;
  mediaType: "image" | "video" | string;
  mediaUrl: string;
  placeId?: string | null;
  routeId?: string | null;
  visibility: "public" | "followers" | "private" | string;
  createdAt: string;
  updatedAt: string;
}

export interface PostMediaDTO {
  id: string;
  postId: string;
  mediaUrl: string;
  mediaType: "image" | "video" | string;
  orderIndex: number;
  createdAt: string;
}

export interface PostLikeDTO {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface PostCommentDTO {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

// Bildirim & event & diğerleri
export interface NotificationDTO {
  id: string;
  userId: string;
  notificationType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordResetDTO {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventDTO {
  id: string;
  name: string;
  description?: string | null;
  city: string;
  location?: string | null;
  cityId?: string | null;
  categoryId?: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowDTO {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

// Transfer Rehberi Tipleri
export type TransferType = 'airport' | 'intercity' | 'intracity';
export type TransportMode = 'metro' | 'bus' | 'rail' | 'ferry' | 'taxi' | 'tram' | 'cable_car' | 'walk';

export interface TransferRouteDTO {
  id: string;
  cityId: string;
  citySlug?: string;
  type: TransferType;
  mode: TransportMode;
  name: string;
  fromPoint: string;
  toPoint: string;
  durationMin?: number | null;
  durationMax?: number | null;
  costAmount?: string | number | null;
  costCurrency?: string | null;
  frequency?: string | null;
  operatingHours?: string | null;
  transportCard?: string | null;
  steps?: string[] | null;
  tags?: string[] | null;
  source: 'osm' | 'manual';
  isActive: boolean;
  lastUpdated: string;
}

export interface TransportCardDTO {
  id: string;
  cityId: string;
  citySlug?: string;
  name: string;
  purchaseLocations?: string[] | null;
  topupLocations?: string[] | null;
  initialCost?: string | number | null;
  currency?: string | null;
  depositRequired: boolean;
  depositAmount?: string | number | null;
  usableOn?: TransportMode[] | null;
}
