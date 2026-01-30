import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { zValidator } from '@hono/zod-validator';
import { db } from '@/db';
import { attendance, insertAttendanceSchema } from '@/db/schema';
import {eq} from 'drizzle-orm'
import { cors } from 'hono/cors';

export const runtime = 'edge';

const app = new Hono().basePath('/api');

//Apply CORS middleware
app.use(
  '*', 
  cors({
    origin: ['http://localhost:3000', 'https://your-production-domain.com'], // Add your domains here
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);


// 1. GET all attendance records
app.get('/attendance', async (c) => {
  try {
    const data = await db.select().from(attendance);
    return c.json(data);
  } catch (e) {
    return c.json({ error: 'Failed to fetch' }, 500);
  }
});

// 2. POST a new record with Zod validation
app.post('/attendance', 
  zValidator('json', insertAttendanceSchema), 
  async (c) => {
    const validatedData = c.req.valid('json');
    
    try {
      const result = await db.insert(attendance).values(validatedData).returning();
      return c.json(result[0], 201);
    } catch (e) {
      return c.json({ error: 'Database insertion failed' }, 500);
    }
  }
);

// 3. GET records for a specific employee
app.get('/attendance/:empId', async (c) => {
  const empId = c.req.param('empId');

  try {
    const records = await db
      .select()
      .from(attendance)
      .where(eq(attendance.employeeId, empId));

    if (records.length === 0) {
      return c.json({ message: 'No records found for this ID' }, 404);
    }

    // NEW: Get the name from the first available record in the history
    const personName = records[0].personName;

    const todayStr = new Date().toLocaleDateString('en-CA'); 

    const todayRecords = records.filter(r => r.accessDate === todayStr);
    const sortedRecords = todayRecords.sort((a, b) => a.accessTime.localeCompare(b.accessTime));

    const morning = sortedRecords.find(r => 
      r.accessTime >= "06:00:00" && r.accessTime <= "08:00:00"
    );

    const evening = sortedRecords.findLast(r => 
      r.accessTime >= "17:29:00" && r.accessTime <= "22:00:00"
    );

    let totalHours = null;
    if (morning && evening) {
      const start = new Date(`${morning.accessDate}T${morning.accessTime}`);
      const end = new Date(`${evening.accessDate}T${evening.accessTime}`);
      totalHours = (((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2));
    }

    return c.json({
      date: todayStr,
      employeeId: empId,
      personName: personName, // Always included now!
      morningShift: morning || null,
      eveningShift: evening || null,
      totalHours: totalHours ? `${totalHours} hrs` : null
    });

  } catch (e) {
    return c.json({ error: 'Database query failed' }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);

export type AppType =typeof app