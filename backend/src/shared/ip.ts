import { Context } from 'hono';

export function getClientIp(c: Context): string {
  const cfConnectingIp = c.req.header('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim());
    const first = parts[0];
    if (first) return first;
  }
  const realIp = c.req.header('x-real-ip');
  if (realIp) return realIp;

  return '127.0.0.1';
}
