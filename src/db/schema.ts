import { pgTable, text, uuid, boolean, timestamp, date, time } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export const attendance = pgTable('attendance', {
  recordId: uuid('record_id').primaryKey().defaultRandom(),
  
  // HikCentral Field: Person Name
  personName: text('person_name').notNull(),
  
  // HikCentral Field: Employee ID
  employeeId: text('employee_id').notNull(),
  
  
  // HikCentral Field: Access Date and Time
  // Changed to timestamp to allow HikCentral to filter by time range accurately
  accessDateAndTime: timestamp('access_date_and_time', { mode: 'string' }).notNull(), 
  
  // HikCentral Field: Access Date
  // Changed to date type (YYYY-MM-DD)
  accessDate: date('access_date').notNull(),
  
  // HikCentral Field: Access Time
  // Changed to time type (HH:mm:ss)
  accessTime: time('access_time').notNull(),
  

});
// Schema for validating API requests
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ recordId: true });