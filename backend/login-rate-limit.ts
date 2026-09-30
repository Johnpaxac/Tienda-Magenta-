type AttemptRecord = {
  failures: number;
  blockedUntil: number;
  lastFailure: number;
};

const attempts = new Map<string, AttemptRecord>();
const maxFailures = 5;
const blockDurationMs = 15 * 60 * 1000;
const retentionMs = 60 * 60 * 1000;

function cleanExpired(now: number) {
  for (const [key, record] of attempts) {
    if (now - record.lastFailure > retentionMs) {
      attempts.delete(key);
    }
  }
}

export function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function isLoginBlocked(key: string) {
  const now = Date.now();
  cleanExpired(now);
  const record = attempts.get(key);

  return record ? Math.max(0, record.blockedUntil - now) : 0;
}

export function registerLoginFailure(key: string) {
  const now = Date.now();
  const current = attempts.get(key) ?? { failures: 0, blockedUntil: 0, lastFailure: now };
  const failures = current.failures + 1;

  attempts.set(key, {
    failures,
    blockedUntil: failures >= maxFailures ? now + blockDurationMs : 0,
    lastFailure: now,
  });
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
