import { useCallback, useEffect, useRef, useState } from 'react';
import { abmKey, abmCloudKey } from './absenceLogic.js';
import { getSession } from '../session/installSession.js';

// بيانات «الغياب الشهري المستورد من Excel» لكل مستخدم — كما كان abmLoad/abmSave القديمان:
// القراءة من localStorage أولاً، وعند غيابها من السحابة (<المستخدم>:abMonthly)؛ والحفظ في الاثنين معاً.
// التخزين السحابي عبر طبقة الجلسة (getSession().storage) — كانتا storageGet/storageSet على window ولم تعودا معرَّفتين منذ الخطوة 47.
const EMPTY = {};

function readLocal(user) {
  try {
    const raw = window.localStorage.getItem(abmKey(user));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) { return null; }
}

export function useMonthlyData(user) {
  const [data, setData] = useState(EMPTY);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    let alive = true;
    const local = readLocal(user);
    if (local) { setData(local); return () => { alive = false; }; }
    setData(EMPTY);
    if (user) {
      Promise.resolve(getSession().storage.get(abmCloudKey(user), true)).then((res) => {
        if (!alive || !res) return;
        try {
          const parsed = JSON.parse(res.value || res);
          if (parsed && typeof parsed === 'object') setData(parsed);
        } catch (e) { /* بيانات سحابية تالفة: نتجاهلها */ }
      }).catch(() => {});
    }
    return () => { alive = false; };
  }, [user]);

  const save = useCallback((next) => {
    setData(next);
    const u = userRef.current;
    try { window.localStorage.setItem(abmKey(u), JSON.stringify(next)); } catch (e) { /* التخزين ممتلئ أو غير متاح */ }
    if (u) {
      Promise.resolve(getSession().storage.set(abmCloudKey(u), JSON.stringify(next), true)).catch(() => {});
    }
  }, []);

  return [data, save];
}
