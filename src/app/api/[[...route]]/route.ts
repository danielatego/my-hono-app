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

    const todayStr = new Date().toLocaleDateString('en-CA'); 

    // 1. Filter for today's records only
    const todayRecords = records.filter(r => r.accessDate === todayStr);

    // 2. Sort today's records by time (ascending: 06:00 -> 22:00)
    const sortedRecords = todayRecords.sort((a, b) => a.accessTime.localeCompare(b.accessTime));

    // 3. Find EARLIEST morning record (First one in sorted list within window)
    const morning = sortedRecords.find(r => 
      r.accessTime >= "06:00:00" && r.accessTime <= "08:00:00"
    );

    // 4. Find LATEST evening record (Last one in sorted list within window)
    // .findLast() is perfect for getting the "latest" entry
    const evening = sortedRecords.findLast(r => 
      r.accessTime >= "17:29:00" && r.accessTime <= "22:00:00"
    );

    // 5. Calculate hours worked
    let totalHours = null;
    if (morning && evening) {
      const start = new Date(`${morning.accessDate}T${morning.accessTime}`);
      const end = new Date(`${evening.accessDate}T${evening.accessTime}`);
      totalHours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2);
    }

    return c.json({
      date: todayStr,
      employeeId: empId,
      morningShift: morning || null, // Earliest
      eveningShift: evening || null, // Latest
      totalHours: totalHours ? `${totalHours} hrs` : null
    });

  } catch (e) {
    return c.json({ error: 'Database query failed' }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);

export type AppType =typeof app