import { pgTable, text, timestamp, uuid, integer, doublePrecision } from "drizzle-orm/pg-core";

//şehirler
export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameTr: text("name_tr").notNull(),
  countryCode: text("country_code").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

//kullanıcı bilgileri
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  userName: text("userName").notNull().unique(),
  dailyBudgetLimit: integer("daily_budget_limit"),
  preferredLanguage: text("preferred_language").default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

//geziler
export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  cityId: uuid("city_id").references(() => cities.id, { onDelete: "cascade" }).notNull(),
  arrivalPoint: text("arrival_point"),
  accommodationArea: text("accommodation_area"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

//şehirdeki tüm keşfedilecek yerler, mekanlar
export const places = pgTable("places", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  category: text("category").notNull(), // müze, restoran, kafe, vs
  rating: integer("rating"), // 1–5 arası puan veya ileride scale değişebilir
  description: text("description"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  priceLevel: integer("price_level"), // 1–5 arası fiyat seviyesi
});

//bir gezi (trip) içindeki rota (günlük plan vb.)
export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .references(() => trips.id, { onDelete: "cascade" })
    .notNull(),
  routeName: text("routeName").notNull(), // rota adı (örn. "İlk gün: Tarihi Yarımada")
  description: text("description"),
  dayIndex: integer("day_index"), // 1,2,3... gibi gün sırası (opsiyonel)
  durationMinutes: integer("duration_minutes"), // toplam süre (dakika)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});