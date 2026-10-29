// مسودات الحقول: تبقى في هذا المتصفح حتى تُحفظ على الخادم، فلا تضيع عند الخروج من اللوحة.
const PREFIX = 'admin:draft:';

function local() { try { return window.localStorage; } catch { return null; } }

export function sameValue(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

export function readDraft(key, storage = local()) {
  try {
    const raw = storage && storage.getItem(PREFIX + key);
    if (raw === null || raw === undefined) return null;
    const v = JSON.parse(raw);
    return v === undefined ? null : v;
  } catch { return null; }
}
export function writeDraft(key, value, storage = local()) {
  try { if (storage) storage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* ممتلئ أو غير متاح */ }
}
export function clearDraft(key, storage = local()) {
  try { if (storage) storage.removeItem(PREFIX + key); } catch { /* غير متاح */ }
}
