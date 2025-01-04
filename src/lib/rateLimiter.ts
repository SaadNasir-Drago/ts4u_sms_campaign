// lib/rateLimiter.ts

type RateLimitEntry = {
  requests: number;
  lastRequestTime: number;
};

const rateLimitMap: Map<string, RateLimitEntry> = new Map();
const RATE_LIMIT_MAX_REQUESTS = 10; // Maximum number of requests
const RATE_LIMIT_WINDOW_MS = 1 * 60 * 1000; // Time window: 1 minute

export async function rateLimiter(req: Request): Promise<void> {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'; 
  const now = Date.now();

  const entry = rateLimitMap.get(ip);

  if (entry) {
    const timeSinceLastRequest = now - entry.lastRequestTime;

    // Reset the rate limit window if the time has passed
    if (timeSinceLastRequest > RATE_LIMIT_WINDOW_MS) {
      entry.requests = 1;
      entry.lastRequestTime = now;
    } else {
      entry.requests += 1;

      if (entry.requests > RATE_LIMIT_MAX_REQUESTS) {
        throw new Error('Too many requests, please try again later.');
      }
    }
  } else {
    // First request from this IP
    rateLimitMap.set(ip, { requests: 1, lastRequestTime: now });
  }
}
