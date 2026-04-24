import {
  boolean,
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  numeric,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────
export const bookingStatus = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'provider_accepted',
  'in_progress',
  'completed',
  'cancelled',
]);

export const providerProfileStatus = pgEnum('provider_profile_status', [
  'draft',
  'pending',
  'approved',
  'rejected',
]);

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),

  // Clerk user ID of the resident
  userId: varchar('user_id', { length: 255 }).notNull(),

  // Provider info (denormalised from mock data for now)
  providerId: varchar('provider_id', { length: 64 }).notNull(),
  providerName: varchar('provider_name', { length: 255 }).notNull(),
  providerCategory: varchar('provider_category', { length: 128 }).notNull(),

  // Service selected
  serviceName: varchar('service_name', { length: 255 }).notNull(),
  servicePrice: numeric('service_price', { precision: 10, scale: 2 }).notNull(),

  // Scheduling
  scheduledDate: varchar('scheduled_date', { length: 32 }).notNull(),  // e.g. "2026-04-10"
  scheduledTime: varchar('scheduled_time', { length: 32 }).notNull(),  // e.g. "10:00 AM"

  // Contact & address
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 32 }).notNull(),
  address: text('address').notNull(),
  landmark: varchar('landmark', { length: 255 }),

  // Payment
  paymentMethod: varchar('payment_method', { length: 64 }).notNull().default('pay_after'),
  platformFee: numeric('platform_fee', { precision: 10, scale: 2 }).notNull().default('29.00'),
  gstAmount: numeric('gst_amount', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),

  // Status lifecycle
  status: bookingStatus('status').notNull().default('confirmed'),

  // NearFix booking reference (e.g. NF-2048)
  bookingRef: varchar('booking_ref', { length: 32 }).notNull(),

  notes: text('notes'),

  // Postgres has no ON UPDATE — bump updatedAt manually in the API layer.
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 64 }).notNull(),
  rating: integer('rating').notNull(),           // 1–5
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Saved Providers ──────────────────────────────────────────────────────────
export const savedProviders = pgTable(
  'saved_providers',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    providerId: varchar('provider_id', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserProvider: uniqueIndex('unique_user_provider').on(table.userId, table.providerId),
  })
);

// ─── Provider Profiles ────────────────────────────────────────────────────────
export const providerProfiles = pgTable(
  'provider_profiles',
  {
    id: serial('id').primaryKey(),
    clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
    businessName: varchar('business_name', { length: 120 }),
    fullName: varchar('full_name', { length: 120 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    city: varchar('city', { length: 80 }).notNull(),
    serviceArea: varchar('service_area', { length: 160 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    yearsExperience: integer('years_experience').notNull(),
    basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
    bio: text('bio').notNull(),
    hasOwnTools: boolean('has_own_tools').notNull().default(false),
    offersEmergencyServices: boolean('offers_emergency_services').notNull().default(false),
    consentTerms: boolean('consent_terms').notNull(),
    consentBackgroundCheck: boolean('consent_background_check').notNull(),
    consentDataProcessing: boolean('consent_data_processing').notNull(),
    status: providerProfileStatus('status').notNull().default('draft'),
    reviewNotes: text('review_notes'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedBy: varchar('reviewed_by', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueClerkUser: uniqueIndex('unique_provider_profile_clerk_user').on(table.clerkUserId),
  })
);

// ─── Types ────────────────────────────────────────────────────────────────────
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type SavedProvider = typeof savedProviders.$inferSelect;
export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type NewProviderProfile = typeof providerProfiles.$inferInsert;
