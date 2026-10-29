// مخزن نافذة المعاينة الموحَّدة: نافذة واحدة مفتوحة كحدٍّ أقصى (كما كانت النوافذ العشر لا تُفتح معاً عملياً).
// openPreview(key, html, { title, word }) تفتح، وclosePreview تغلق، وتُغلق تلقائياً عند تغيّر البوابة.
import { useSyncExternalStore } from 'react';
import { PREVIEWS } from './previewSpecs.js';

let state = null;
const listeners = new Set();
const emit = (next) => { state = next; listeners.forEach((fn) => fn()); };

export const getPreview = () => state;
export const subscribePreview = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const usePreview = () => useSyncExternalStore(subscribePreview, getPreview);

// النافذة تُرسم داخل صفحة البوابة النشطة (كالقديم) لأن CSS الطباعة يخفي بقية الصفحة ويُبقي النافذة المفتوحة داخلها
const activeHost = () => (typeof document !== 'undefined' ? document.querySelector('.tool-page.active') || document.body : null);

export function openPreview(key, html, opts = {}) {
  const spec = PREVIEWS[key];
  if (!spec) throw new Error('نافذة معاينة غير معروفة: ' + key);
  emit({ key, html, title: opts.title || spec.title, word: opts.word || spec.word, host: activeHost() });
}

export function closePreview() { if (state) emit(null); }
