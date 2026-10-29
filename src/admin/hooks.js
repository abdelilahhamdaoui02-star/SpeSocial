import { useCallback, useEffect, useRef, useState } from 'react';
import { readDraft, writeDraft, clearDraft, sameValue } from './draftStore.js';

// رسالة حالة صغيرة تحت كل بطاقة
export function useMsg() {
  const [m, setM] = useState({ text: '', cls: '' });
  const say = useCallback((text, cls = '') => setM({ text, cls }), []);
  return [m, say];
}

// حقل/نموذج يحتفظ بمسودته في المتصفح حتى يُحفظ على الخادم.
// serverValue = القيمة المحفوظة فعلاً. dirty = توجد تعديلات لم تُحفظ بعد.
export function useDraft(key, serverValue) {
  const [draft, setDraft] = useState(() => readDraft(key));
  const value = draft === null ? serverValue : draft;
  const valueRef = useRef(value);
  valueRef.current = value;
  const serverRef = useRef(serverValue);
  serverRef.current = serverValue;

  const set = useCallback((next) => {
    const v = typeof next === 'function' ? next(valueRef.current) : next;
    if (sameValue(v, serverRef.current)) { clearDraft(key); setDraft(null); return; }
    writeDraft(key, v); setDraft(v);
  }, [key]);
  const clear = useCallback(() => { clearDraft(key); setDraft(null); }, [key]);

  // مسودة صارت مطابقة للمحفوظ (بعد حفظ ناجح مثلاً) ← تُنظَّف
  const serverJson = JSON.stringify(serverValue);
  useEffect(() => {
    if (draft !== null && JSON.stringify(draft) === serverJson) { clearDraft(key); setDraft(null); }
  }, [draft, serverJson, key]);

  const dirty = draft !== null && !sameValue(draft, serverValue);
  return { value, set, clear, dirty };
}

// إعدادات المنصة من الخادم + دالة حفظ آمنة (قراءة ← تعديل ← كتابة ← تحقق)
export function useSiteConfig(api, active) {
  const [state, setState] = useState({ status: 'idle', cfg: {}, error: '' });
  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    try { const { cfg } = await api.readSite(); setState({ status: 'ready', cfg, error: '' }); }
    catch (e) { setState((s) => ({ status: 'error', cfg: s.cfg, error: (e && e.message) || 'خطأ' })); }
  }, [api]);
  useEffect(() => { if (active) load(); }, [active, load]);
  const save = useCallback(async (mutate) => {
    const { cfg } = await api.saveSite(mutate);
    setState({ status: 'ready', cfg, error: '' });
    return cfg;
  }, [api]);
  return { ...state, reload: load, save };
}
