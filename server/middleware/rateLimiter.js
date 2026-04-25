'use strict';

/**
 * Simple in-memory rate limiter for login attempts.
 * Tracks failed attempts per IP and locks out after MAX_ATTEMPTS.
 * No external dependency required.
 */

const MAX_ATTEMPTS  = 10;        // max failed attempts
const WINDOW_MS     = 15 * 60 * 1000; // 15-minute window
const LOCKOUT_MS    = 15 * 60 * 1000; // lockout duration

const store = new Map(); // ip -> { count, firstAttempt, lockedUntil }

function getRecord(ip) {
  if (!store.has(ip)) store.set(ip, { count: 0, firstAttempt: Date.now(), lockedUntil: null });
  return store.get(ip);
}

function loginRateLimit(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const rec = getRecord(ip);
  const now = Date.now();

  // Clear expired lockout
  if (rec.lockedUntil && now > rec.lockedUntil) {
    rec.count = 0;
    rec.firstAttempt = now;
    rec.lockedUntil = null;
  }

  // Currently locked out
  if (rec.lockedUntil && now <= rec.lockedUntil) {
    const retryAfter = Math.ceil((rec.lockedUntil - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: `Too many login attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
    });
  }

  // Reset window if expired
  if (now - rec.firstAttempt > WINDOW_MS) {
    rec.count = 0;
    rec.firstAttempt = now;
  }

  // Attach callback to increment on failure
  req._onLoginFailure = () => {
    rec.count++;
    if (rec.count >= MAX_ATTEMPTS) {
      rec.lockedUntil = Date.now() + LOCKOUT_MS;
    }
  };
  req._onLoginSuccess = () => {
    rec.count = 0;
    rec.lockedUntil = null;
  };

  next();
}

module.exports = { loginRateLimit };
