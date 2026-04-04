import { pgTable, uuid, varchar, doublePrecision, text, timestamp } from "drizzle-orm/pg-core";

export const pois = pgTable("pois", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: varchar("source_id", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  address: text("address"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
