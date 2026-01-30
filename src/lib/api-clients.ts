import { hc } from 'hono/client';
import type { AppType } from '@/app/api/[[...route]]/route';

// We determine the base URL based on the environment
const clientUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const client = hc<AppType>(clientUrl);