// الحماية من محاولات الدخول المتكررة — منقولة حرفياً من AUTH_RATE القديم
// (نفس مفتاح sessionStorage، فيبقى العداد متّسقاً مع النسخة القديمة)
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
export const WARN_AT = 3;

const key = () => 'auth:ratelimit:' + (window.location.hostname || 'local');

function load() {
  try {
    const raw = sessionStorage.getItem(key());
    return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: 0 };
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function save(d) {
  try { sessionStorage.setItem(key(), JSON.stringify(d)); } catch {}
}

// الدقائق المتبقية للإغلاق، أو false إن لم يكن الجهاز محظوراً
export function isLocked() {
  const d = load();
  if (d.lockedUntil && Date.now() < d.lockedUntil) {
    return Math.ceil((d.lockedUntil - Date.now()) / 60000);
  }
  return false;
}

export function recordFailure() {
  const d = load();
  d.attempts = (d.attempts || 0) + 1;
  if (d.attempts >= MAX_ATTEMPTS) d.lockedUntil = Date.now() + LOCKOUT_MS;
  save(d);
  return d.attempts;
}

export function remaining() {
  return Math.max(0, MAX_ATTEMPTS - (load().attempts || 0));
}

export function reset() {
  try { sessionStorage.removeItem(key()); } catch {}
}
