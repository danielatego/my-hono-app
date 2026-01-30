import { pgTable, text, uuid, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export const attendance = pgTable('attendance', {
  recordId: uuid('record_id').primaryKey().defaultRandom(),
  personName: text('person_name').notNull(),
  employeeId: text('employee_id').notNull(),
  accessDateAndTime: text('access_date_and_time').notNull(), // Matching your TEXT type
  accessDate: text('access_date').notNull(),
  accessTime: text('access_time').notNull(),
  authenticationResult: text('authentication_result').default('false'),
  attendanceStatus: text('attendance_status'),
});

// Schema for validating API requests
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ recordId: true });