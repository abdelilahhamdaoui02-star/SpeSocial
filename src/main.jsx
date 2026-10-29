import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { installFirebase } from './services/firebase.js';
import { installStore } from './store/legacyStore.js';
import { applyStoredAppearance } from './settings/settingsLogic.js';

// المظهر المحفوظ (الوضع الليلي وحجم الخط واللون) قبل أول رسم لتفادي وميض الألوان الافتراضية
try { applyStoredAppearance(document, window.localStorage); } catch (e) { /* التخزين غير متاح */ }
// نبدأ Firebase قبل رسم React وقبل تحميل السكربتات القديمة (كان script-01.js يفعل ذلك)
installFirebase();
// نستمع لأحداث البيانات القديمة قبل أي دخول
installStore();

createRoot(document.getElementById('root')).render(<App />);
