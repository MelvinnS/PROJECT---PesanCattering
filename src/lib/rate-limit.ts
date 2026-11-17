interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiting store
// Catatan arsitektur: Untuk skala produksi terdistribusi (misal multi-region serverless),
// disarankan menggunakan Redis terpusat seperti Upstash Redis.
const memoryStore = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000; // 10 menit

/**
 * Membatasi percobaan request (misal login WA) maksimal 10x per IP per 10 menit
 */
export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; retryAfterMinutes?: number } {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(identifier, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const diffMinutes = Math.ceil((entry.resetAt - now) / (60 * 1000));
    return { allowed: false, remaining: 0, retryAfterMinutes: diffMinutes };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}
