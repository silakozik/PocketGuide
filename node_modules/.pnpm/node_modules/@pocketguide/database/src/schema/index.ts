import { pgTable, text, timestamp, uuid, integer, doublePrecision, jsonb, boolean } from "drizzle-orm/pg-core";
import { pois } from "./poi.schema";

//şehirler
export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("nameEn").notNull(),
  nameTr: text("nameTr").notNull(),
  countryCode: text("countryCode").notNull(),
  status: text("status").notNull().default("active"), // active | passive
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//kullanıcı bilgileri
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  userName: text("userName").notNull().unique(),
  studentStatus: text("studentStatus"), // örn. student / non_student
  dailyBudgetLimit: integer("dailyBudgetLimit"),
  preferredLanguage: text("preferredLanguage").default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//geziler
export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
  cityId: uuid("cityId").references(() => cities.id, { onDelete: "cascade" }).notNull(),
  arrivalPoint: text("arrivalPoint"),
  accommodationArea: text("accommodationArea"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});


//bir gezi (trip) içindeki rota (günlük plan vb.)
export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("tripId")
    .references(() => trips.id, { onDelete: "cascade" })
    .notNull(),
  routeName: text("routeName").notNull(), // rota adı (örn. "İlk gün: Tarihi Yarımada")
  description: text("description"),
  dayIndex: integer("dayIndex"), // 1,2,3... gibi gün sırası (opsiyonel)
  durationMinutes: integer("durationMinutes"), // toplam süre (dakika)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//rotadaki her yerin sırası ve detayları (route ↔ place join tablosu)
export const routePlaces = pgTable("routePlaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  routeId: uuid("routeId")
    .references(() => routes.id, { onDelete: "cascade" })
    .notNull(),
  placeId: uuid("placeId")
    .references(() => pois.id, { onDelete: "cascade" })
    .notNull(),
  orderIndex: integer("orderIndex"), // rotadaki sırası: 1,2,3...
  stayMinutes: integer("stayMinutes"), // burada kaç dakika geçirecek
  note: text("note"), // kısa not / ipucu
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//Kullanıcıya gönderilen hatırlatmalar veya öneriler
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  notificationType: text("notificationType").notNull(), // alert, reminder, info
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//Kişiselleştirme (tema, dil, rota tercihi)
export const userSettings = pgTable("userSettings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  preferredLanguage: text("preferredLanguage").default("en"),
  theme: text("theme").default("light"),
  currency: text("currency").default("EUR"), // para birimi: EUR, USD, TRY...
  timezone: text("timezone").default("Europe/Istanbul"), // IANA timezone
  dailyBudgetLimit: integer("dailyBudgetLimit"),
  //preferredDurationMinutes: integer("preferred_duration_minutes"), // günlük ideal gezi süresi (dakika)
  notificationPreferences: jsonb("notificationPreferences"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//şifre sıfırlama talepleri (forgot password)
export const passwordResets = pgTable("passwordResets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  tokenHash: text("tokenHash").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//kullanıcı yorumları
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  placeId: uuid("placeId")
    .references(() => pois.id, { onDelete: "cascade" })
    .notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//kullanıcının favori veya görmek istediği yerler
export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  placeId: uuid("placeId")
    .references(() => pois.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//yerlerin kategorilerinin tutmak için
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//şehirdeki etkinlikleri tutmak için
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  city: text("city").notNull(), // insan gözüyle görünen şehir adı (örn. Istanbul)
  location: text("location"), // mekan / salon / adres bilgisi
  cityId: uuid("cityId").references(() => cities.id, { onDelete: "cascade" }),
  categoryId: uuid("categoryId").references(() => categories.id, { onDelete: "cascade" }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//kullanıcı profili (bio, avatar, gizlilik)
export const userProfiles = pgTable("userProfiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  displayName: text("displayName"),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  website: text("website"),
  isPrivate: boolean("isPrivate").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//takip ilişkisi (follower → following)
export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: uuid("followerId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  followingId: uuid("followingId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

//gönderiler (post / video)
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  caption: text("caption"),
  mediaType: text("mediaType").notNull(), // image | video
  mediaUrl: text("mediaUrl").notNull(),
  placeId: uuid("placeId").references(() => pois.id, { onDelete: "set null" }),
  routeId: uuid("routeId").references(() => routes.id, { onDelete: "set null" }),
  visibility: text("visibility").default("public"), // public | followers | private
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//bir postta birden fazla medya (carousel)
export const postMedia = pgTable("postMedia", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("postId")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: text("mediaType").notNull(), // image | video
  orderIndex: integer("orderIndex").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

//post beğenileri
export const postLikes = pgTable("postLikes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("postId")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

//post yorumları
export const postComments = pgTable("postComments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("postId")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export * from "./poi.schema";
