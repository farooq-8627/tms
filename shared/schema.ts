import { 
  pgTable, 
  serial, 
  varchar, 
  integer, 
  json, 
  timestamp, 
  text, 
  boolean, 
  primaryKey, 
  real
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table for tracking who is recording/viewing biometric data
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Sessions for authentication and tracking
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Rooms for WebRTC connections
export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  roomId: varchar('room_id', { length: 50 }).notNull().unique(),
  hostUserId: integer('host_user_id').references(() => users.id),
  name: varchar('name', { length: 100 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull()
});

// Biometric sessions for recording data
export const biometricSessions = pgTable('biometric_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  roomId: integer('room_id').references(() => rooms.id),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  description: text('description'),
  metadata: json('metadata')
});

// Heart rate measurements
export const heartRateMeasurements = pgTable('heart_rate_measurements', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => biometricSessions.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  bpm: integer('bpm').notNull(),
  confidence: real('confidence')
});

// Emotion measurements
export const emotionMeasurements = pgTable('emotion_measurements', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => biometricSessions.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  dominantEmotion: varchar('dominant_emotion', { length: 50 }).notNull(),
  emotions: json('emotions')
});

// Attention measurements
export const attentionMeasurements = pgTable('attention_measurements', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => biometricSessions.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  attentionScore: integer('attention_score').notNull(),
  fixationCount: integer('fixation_count'),
  saccadeCount: integer('saccade_count'),
  blinkRate: real('blink_rate')
});

// Eye tracking measurements
export const eyeTrackingMeasurements = pgTable('eye_tracking_measurements', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => biometricSessions.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  leftEyePosition: json('left_eye_position'),
  rightEyePosition: json('right_eye_position'),
  gazeDirection: json('gaze_direction')
});

// Room participants (joins between users and rooms)
export const roomParticipants = pgTable('room_participants', {
  userId: integer('user_id').notNull().references(() => users.id),
  roomId: integer('room_id').notNull().references(() => rooms.id),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
  role: varchar('role', { length: 50 }).default('viewer'),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.roomId] })
  };
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  hostedRooms: many(rooms, { relationName: 'hostedRooms' }),
  biometricSessions: many(biometricSessions),
  roomParticipants: many(roomParticipants)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  host: one(users, {
    fields: [rooms.hostUserId],
    references: [users.id],
    relationName: 'hostedRooms'
  }),
  biometricSessions: many(biometricSessions),
  participants: many(roomParticipants)
}));

export const biometricSessionsRelations = relations(biometricSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [biometricSessions.userId],
    references: [users.id]
  }),
  room: one(rooms, {
    fields: [biometricSessions.roomId],
    references: [rooms.id]
  }),
  heartRateMeasurements: many(heartRateMeasurements),
  emotionMeasurements: many(emotionMeasurements),
  attentionMeasurements: many(attentionMeasurements),
  eyeTrackingMeasurements: many(eyeTrackingMeasurements)
}));

export const heartRateMeasurementsRelations = relations(heartRateMeasurements, ({ one }) => ({
  session: one(biometricSessions, {
    fields: [heartRateMeasurements.sessionId],
    references: [biometricSessions.id]
  })
}));

export const emotionMeasurementsRelations = relations(emotionMeasurements, ({ one }) => ({
  session: one(biometricSessions, {
    fields: [emotionMeasurements.sessionId],
    references: [biometricSessions.id]
  })
}));

export const attentionMeasurementsRelations = relations(attentionMeasurements, ({ one }) => ({
  session: one(biometricSessions, {
    fields: [attentionMeasurements.sessionId],
    references: [biometricSessions.id]
  })
}));

export const eyeTrackingMeasurementsRelations = relations(eyeTrackingMeasurements, ({ one }) => ({
  session: one(biometricSessions, {
    fields: [eyeTrackingMeasurements.sessionId],
    references: [biometricSessions.id]
  })
}));

export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
  user: one(users, {
    fields: [roomParticipants.userId],
    references: [users.id]
  }),
  room: one(rooms, {
    fields: [roomParticipants.roomId],
    references: [rooms.id]
  })
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

export type BiometricSession = typeof biometricSessions.$inferSelect;
export type InsertBiometricSession = typeof biometricSessions.$inferInsert;

export type HeartRateMeasurement = typeof heartRateMeasurements.$inferSelect;
export type InsertHeartRateMeasurement = typeof heartRateMeasurements.$inferInsert;

export type EmotionMeasurement = typeof emotionMeasurements.$inferSelect;
export type InsertEmotionMeasurement = typeof emotionMeasurements.$inferInsert;

export type AttentionMeasurement = typeof attentionMeasurements.$inferSelect;
export type InsertAttentionMeasurement = typeof attentionMeasurements.$inferInsert;

export type EyeTrackingMeasurement = typeof eyeTrackingMeasurements.$inferSelect;
export type InsertEyeTrackingMeasurement = typeof eyeTrackingMeasurements.$inferInsert;

export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertRoomParticipant = typeof roomParticipants.$inferInsert;