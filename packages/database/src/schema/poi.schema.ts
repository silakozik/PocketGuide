import { pgTable, uuid, varchar, doublePrecision, text, timestamp, integer, index, customType } from "drizzle-orm/pg-core";
import { cities } from "./index";

// Custom type for PostGIS geography
const geography = customType<{ data: { lng: number; lat: number }, driverData: string }>({
  dataType() {
    return 'geography(Point, 4326)';
  },
  toDriver(value) {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  fromDriver(value: string) {
    const matches = value.match(/POINT\((?<lng>[-\d.]+) (?<lat>[-\d.]+)\)/);
    if (!matches?.groups) {
      throw new Error(`Invalid geography formatting: ${value}`);
    }
    return {
      lng: parseFloat(matches.groups.lng),
      lat: parseFloat(matches.groups.lat),
    };
  },
});

export const pois = pgTable("pois", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: varchar("source_id", { length: 255 }), // can be null for user-created places
  provider: varchar("provider", { length: 50 }), // google, foursquare, gtfs, osm
  name: varchar("name", { length: 255 }).notNull(),
  cityId: uuid("cityId").references(() => cities.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(),
  address: text("address"),
  description: text("description"),
  rating: doublePrecision("rating"),
  priceLevel: integer("priceLevel"),
  location: geography("location").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  spatialIndex: index("pois_spatial_idx").using("gist", table.location),
}));
