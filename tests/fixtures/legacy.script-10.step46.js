
// ======= PORTAL NAVIGATION =======
// (التنقل بين البوابات والشريط المجمَّد انتقلا إلى React: src/navigation.js وsrc/nav. openTool وgoBack تُسجَّلان على window لمعالجات onclick في body.html)

// (مساعدات الطباعة انتقلت إلى React: src/print/printHelpers.js — وضع الطباعة i-print-mode والجدول المضغوط وانتظار الشعار)
// (دوال toggleProc وval وgetRadio وgetChecked وrField وiEsc وiAutoCheck القديمة حُذفت: لم يعد يستدعيها أحد، وكل بوابة React لها نسختها الخاصة)

// ======= المقابلات الفردية: انتقلت إلى React (src/interview) =======


// Archive

// ======= AUTH & CLOUD STORAGE SYSTEM =======
let currentUser = null;
let userProfile = {};

// In-memory data store
const appData = {
  interviewArchive: [],
  reintegrationArchive: [],
  absenceArchive: [],
  taskLog: [],
  violenceArchive: [],
  contactsArchive: [],
  workshopsArchive: [],
  specialNeedsArchive: [],
  vigilanceCases: [],
  behaviorFiles: [],
  pdAssocArchive: [],
  pdHealthArchive: [],
  parentCalls: [], parentMeetings: [], followUp: []
};

// ── Storage layer — DUAL: always localStorage + Firebase Firestore ──
// يستخدم Firebase Firestore للتخزين السحابي مع localStorage كاحتياطي
let STORAGE_IS_CLOUD = false;

// انتظار تجهيز Firebase قبل بدء التطبيق
(async function waitForFirebase() {
  if (window._firebaseReady) {
    try {
      const ok = await window._firebaseReady;
      STORAGE_IS_CLOUD = ok && typeof window.storage !== 'undefined';
    } catch { STORAGE_IS_CLOUD = false; }
  }
})();

// Keys that belong to ALL users (not user-specific) — stored shared
const SHARED_KEYS = ['auth:users'];

async function storageGet(key, shared) {
  // 🔥 Firebase أولاً دائماً للبيانات المشتركة — localStorage فقط كاحتياطي عند انقطاع الاتصال
  if (STORAGE_IS_CLOUD && shared) {
    try {
      const r = await window.storage.get(key, true);
      if (r && r.value) {
        // مزامنة مع localStorage كنسخة احتياطية محلية
        try { localStorage.setItem(key, r.value); } catch {}
        return r.value;
      }
      // Firebase متصل لكن لا توجد بيانات — لا نرجع localStorage لتفادي بيانات قديمة
      return null;
    } catch (err) {
      console.warn('Firebase GET error — falling back to localStorage:', err);
      // عند فشل Firebase فقط نرجع للنسخة المحلية
      const local = (() => { try { return localStorage.getItem(key); } catch { return null; } })();
      return local;
    }
  }
  // بدون Firebase — localStorage فقط
  const local = (() => { try { return localStorage.getItem(key); } catch { return null; } })();
  return local;
}

async function storageSet(key, value, shared) {
  // ✅ حفظ محلي فوري دائماً — لا ينتظر Firebase
  try { localStorage.setItem(key, value); } catch(e) {}

  if (STORAGE_IS_CLOUD && shared) {
    // ✅ مهلة 8 ثانية للحفظ السحابي — إذا تجاوزها يكتفي بالمحلي
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 8000)
    );
    try {
      await Promise.race([window.storage.set(key, value, true), timeout]);
    } catch(err) {
      const msg = err.message === 'timeout'
        ? '⚠️ الحفظ السحابي استغرق وقتاً طويلاً — تم الحفظ محلياً'
        : '⚠️ فشل الحفظ السحابي — البيانات محفوظة محلياً فقط';
      console.warn(msg, err);
      if (typeof showToast === 'function') showToast(msg, 'warning');
    }
  } else if (shared && !STORAGE_IS_CLOUD) {
    console.warn('⚠️ Firebase غير متصل — الحفظ محلي فقط، لن تتزامن البيانات بين الأجهزة.');
  }
}

// ── Session persistence: remember last logged-in user ──
function sessionSave(username) {
  try { localStorage.setItem('app:session:user', username); } catch {}
}
function sessionClear() {
  try { localStorage.removeItem('app:session:user'); } catch {}
}
function sessionGet() {
  try { return localStorage.getItem('app:session:user'); } catch { return null; }
}

// ── Auto-login from saved session ──
async function tryAutoLogin() {
  if (!navigator.onLine || !STORAGE_IS_CLOUD || !window._fbAuth) return false;
  try {
    const name = await window._fbAuth.restore();
    if (!name) return false;
    currentUser = name;
    await loadUserData();
    authEnterApp();
    return true;
  } catch { return false; }
}

// Update Firebase status indicator on page load (even before login)
window.addEventListener('load', () => {
  setTimeout(async () => {
    if (window._firebaseReady) {
      try { await window._firebaseReady; } catch {}
    }
    if (typeof fbUpdateStatus === 'function') fbUpdateStatus();
  }, 1200);
});

async function loadUserData() {
  const keys = ['parentCalls','parentMeetings','followUp','interviewArchive','reintegrationArchive','absenceArchive','taskLog','violenceArchive','contactsArchive','workshopsArchive','specialNeedsArchive','vigilanceCases','behaviorFiles','pdAssocArchive','pdHealthArchive'];
  // ✅ تحميل متوازي بدلاً من المتسلسل — أسرع بكثير
  await Promise.all(keys.map(async key => {
    try {
      const v = await storageGet(currentUser + ':' + key, true);
      appData[key] = v ? JSON.parse(v) : [];
    } catch { appData[key] = []; }
  }));
  // Load profile
  try {
    const v = await storageGet(currentUser + ':profile', true);
    userProfile = v ? JSON.parse(v) : {};
  } catch { userProfile = {}; }
  // ── تحميل قائمة التلاميذ الخاصة بهذا المستخدم من Firebase ──
  try {
    const v = await storageGet(currentUser + ':customStudents', true);
    if (v) {
      const list = JSON.parse(v);
      const localKey = 'app:customStudents:' + currentUser;
      try { localStorage.setItem(localKey, JSON.stringify(list)); } catch(e) {}
      // إعادة بناء STUDENT_DB بقائمة هذا المستخدم
      StudentDb.replaceFromCustom(list);
    } else {
      // لا توجد قائمة في Firebase — نفرّغ STUDENT_DB وlocalStorage لهذا المستخدم
      try { localStorage.removeItem('app:customStudents:' + currentUser); } catch(e) {}
      StudentDb.clear();
    }
  } catch(e) {}
  window.dispatchEvent(new Event('legacy:data-loaded'));
}

async function saveUserKey(key) {
  if (!currentUser) return false;
  try {
    const jsonStr = JSON.stringify(appData[key]);
    // البيانات في الذاكرة صارت محدَّثة الآن؛ نُبلغ واجهة React فوراً دون انتظار اكتمال الحفظ السحابي
    window.dispatchEvent(new CustomEvent('legacy:data-changed', { detail: { key } }));
    if (jsonStr.length > 800000 && typeof showToast === 'function') {
      showToast('⚠️ حجم البيانات كبير — فكر في أرشفة السجلات القديمة', 'warning');
    }
    await storageSet(currentUser + ':' + key, jsonStr, true);
    window.dispatchEvent(new CustomEvent('legacy:data-changed', { detail: { key } }));
    if (STORAGE_IS_CLOUD) {
      console.log('✅ تم الحفظ السحابي: ' + currentUser + ':' + key + ' (' + Math.round(jsonStr.length/1024) + 'KB)');
    } else {
      console.warn('⚠️ حُفظ محلياً فقط: ' + currentUser + ':' + key);
    }
    return true;
  } catch(e) {
    console.error('❌ فشل الحفظ:', e);
    if (typeof showToast === 'function') {
      showToast('❌ فشل حفظ البيانات — تحقق من اتصالك بالإنترنت', 'error');
    }
    return false;
  }
}

function authShowTab(tab) {
  // Hide all forms
  document.getElementById('authLoginForm').style.display = 'none';
  document.getElementById('authError').textContent = '';
  document.getElementById('authError').style.color = '#dc2626';

  if (tab === 'login') document.getElementById('authLoginForm').style.display = '';
}

// ======= GLOBAL STUDENT SEARCH =======
// (البحث العام عن تلميذ انتقل إلى React: src/search)

function authToggleEye(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

// ── Normalize identifier: phone or email → canonical key ──
function normalizeIdentifier(raw) {
  const v = (raw || '').trim().toLowerCase();
  // Email
  if (v.includes('@')) return 'email:' + v;
  // Phone: strip spaces/dashes, normalize Moroccan format
  const digits = v.replace(/[\s\-+]/g, '');
  if (/^\d{8,15}$/.test(digits)) return 'phone:' + digits;
  return 'id:' + v;
}

// ══════════════════════════════════════════════════════════════
//  🛡️ RATE LIMITER — نظام الحماية من محاولات الدخول المتكررة
//  الحد الأقصى: 5 محاولات — ثم إغلاق لمدة 15 دقيقة
// ══════════════════════════════════════════════════════════════
const AUTH_RATE = {
  MAX_ATTEMPTS: 5,        // أقصى عدد محاولات فاشلة
  LOCKOUT_MS: 15 * 60 * 1000,  // مدة الإغلاق: 15 دقيقة
  WARN_AT: 3,             // تحذير عند المحاولة الثالثة

  _key: () => 'auth:ratelimit:' + (window.location.hostname || 'local'),

  _load() {
    try {
      const raw = sessionStorage.getItem(this._key());
      return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: 0 };
    } catch { return { attempts: 0, lockedUntil: 0 }; }
  },

  _save(data) {
    try { sessionStorage.setItem(this._key(), JSON.stringify(data)); } catch {}
  },

  // هل الجهاز محظور حالياً؟
  isLocked() {
    const d = this._load();
    if (d.lockedUntil && Date.now() < d.lockedUntil) {
      return Math.ceil((d.lockedUntil - Date.now()) / 60000); // الدقائق المتبقية
    }
    return false;
  },

  // تسجيل محاولة فاشلة
  recordFailure() {
    const d = this._load();
    d.attempts = (d.attempts || 0) + 1;
    if (d.attempts >= this.MAX_ATTEMPTS) {
      d.lockedUntil = Date.now() + this.LOCKOUT_MS;
    }
    this._save(d);
    return d.attempts;
  },

  // عدد المحاولات المتبقية
  remaining() {
    const d = this._load();
    return Math.max(0, this.MAX_ATTEMPTS - (d.attempts || 0));
  },

  // إعادة تعيين عند نجاح الدخول
  reset() {
    try { sessionStorage.removeItem(this._key()); } catch {}
  }
};

async function authDoLogin() {
  const rawInput = document.getElementById('authUsername').value.trim().toLowerCase();
  const password = document.getElementById('authPassword').value;
  const errEl = document.getElementById('authError');
  const loadEl = document.getElementById('authLoading');
  const btn = document.getElementById('authLoginBtn');

  errEl.textContent = '';

  // ── 🛡️ فحص الإغلاق أولاً ──
  const lockedMins = AUTH_RATE.isLocked();
  if (lockedMins !== false) {
    errEl.style.color = '#dc2626';
    errEl.textContent = `🔒 تم إغلاق الدخول مؤقتاً بسبب كثرة المحاولات. انتظر ${lockedMins} دقيقة وحاول مجدداً.`;
    btn.disabled = true;
    // عداد تنازلي يُحدَّث كل ثانية
    const timer = setInterval(() => {
      const mins = AUTH_RATE.isLocked();
      if (mins === false) {
        clearInterval(timer);
        errEl.textContent = '✅ يمكنك المحاولة مجدداً.';
        errEl.style.color = '#16a34a';
        btn.disabled = false;
      } else {
        errEl.textContent = `🔒 تم إغلاق الدخول مؤقتاً. انتظر ${mins} دقيقة.`;
      }
    }, 10000);
    return;
  }

  // ── شرط الإنترنت ──
  if (!navigator.onLine) {
    errEl.textContent = '📡 لا يوجد اتصال بالإنترنت. تأكد من الاتصال وأعد المحاولة.';
    return;
  }
  // ── شرط Firebase: انتظر حتى 5 ثوانٍ ريثما يكتمل الاتصال ──
  if (!STORAGE_IS_CLOUD) {
    loadEl.textContent = '⏳ جارٍ الاتصال بـ Firebase...';
    btn.disabled = true;
    let _waited = 0;
    await new Promise(resolve => {
      const _check = setInterval(async () => {
        _waited += 300;
        try {
          if (window._firebaseReady) {
            const ok = await window._firebaseReady;
            STORAGE_IS_CLOUD = ok && typeof window.storage !== 'undefined';
          }
        } catch(e) {}
        if (STORAGE_IS_CLOUD || _waited >= 5000) { clearInterval(_check); resolve(); }
      }, 300);
    });
    btn.disabled = false;
    loadEl.textContent = '';
    if (!STORAGE_IS_CLOUD) {
      errEl.textContent = '🔥 Firebase غير متصل. يرجى إعداد Firebase أولاً من الزر أدناه.';
      return;
    }
  }

  if (!rawInput || !password) { errEl.textContent = '⚠️ يرجى ملء جميع الحقول.'; return; }

  // Validate username format
  if (!/^[a-z0-9_\-\.]{2,30}$/.test(rawInput)) {
    errEl.textContent = '⚠️ اسم الحساب يجب أن يحتوي على حروف إنجليزية وأرقام فقط.'; return;
  }

  btn.disabled = true;
  loadEl.textContent = '⏳ جارٍ التحقق...';

  try {
    let verifiedName;
    try {
      verifiedName = await window._fbAuth.login(rawInput, password);
    } catch (err) {
      const code = (err && err.code) || '';
      if (code === 'auth/network-request-failed') {
        errEl.style.color = '#dc2626';
        errEl.textContent = '📡 تعذّر الاتصال. تحقق من الإنترنت وأعد المحاولة.';
        return;
      }
      if (code === 'auth/too-many-requests') {
        errEl.style.color = '#dc2626';
        errEl.textContent = '🔒 تم تعليق المحاولات مؤقتًا بسبب كثرتها. حاول لاحقًا.';
        return;
      }
      const attempts = AUTH_RATE.recordFailure();
      const remaining = AUTH_RATE.remaining();
      if (code === 'app/not-approved') {
        errEl.style.color = '#dc2626';
        errEl.textContent = '⛔ هذا الحساب غير مفعّل. تواصل مع المسؤول.';
      } else if (remaining <= 0) {
        errEl.style.color = '#dc2626';
        errEl.textContent = '🔒 تم إغلاق الدخول لمدة 15 دقيقة بسبب كثرة المحاولات الفاشلة.';
      } else if (attempts >= AUTH_RATE.WARN_AT) {
        errEl.style.color = '#d97706';
        errEl.textContent = `❌ اسم الحساب أو كلمة المرور غير صحيحة. تبقّى لك ${remaining} محاولة قبل الإغلاق.`;
      } else {
        errEl.style.color = '';
        errEl.textContent = '❌ اسم الحساب أو كلمة المرور غير صحيحة.';
      }
      return;
    }

    // ── نجاح الدخول: إعادة تعيين العداد ──
    AUTH_RATE.reset();
    errEl.style.color = '';
    currentUser = verifiedName;
    loadEl.textContent = '📥 جارٍ تحميل بياناتك...';
    await loadUserData();
    authEnterApp();
  } catch(e) {
    errEl.textContent = '❌ خطأ في تسجيل الدخول: ' + (e.message || 'حاول مجدداً.');
    console.error(e);
  } finally {
    btn.disabled = false;
    loadEl.textContent = '';
  }
}

// (إعدادات المنصة من لوحة الأدمين — اسم الوزارة وأسماء البوابات والميزاجور — وتحميلها صارت في src/institution، وتُسجَّل applySiteConfig وloadSiteConfig على window قبل تحميل هذا السكربت)


// ═══ التواصل مع الأولياء + المتابعة: انتقلتا إلى React (src/gates). بقي هنا ما تحتاجه الواجهة الجديدة: ═══
// pgExportXlsx (التصدير إلى Excel). أزرار نافذة المعاينة صارت في src/preview.
function pgImgSize(src) {
  return new Promise(res => {
    if (typeof Image === 'undefined') return res({ w: 520, h: 97 });
    const im = new Image(); im.onload = () => res({ w: im.naturalWidth || 520, h: im.naturalHeight || 97 }); im.onerror = () => res({ w: 520, h: 97 }); im.src = src;
  });
}
async function pgExportXlsx(o, rows) {
  const F = o.fields, n = F.length + 1, title = o.print || o.file;
  const inst = (userProfile && userProfile.institution) || 'المؤسسة التعليمية', dir = getDirectorate();
  const dateStr = new Date().toLocaleDateString('ar-MA');
  if (!window.ExcelJS) { // احتياطي: تصدير مبسّط باتجاه من اليمين لليسار
    const ws = XLSX.utils.json_to_sheet(rows.map(r => Object.fromEntries(F.map(f => [f.l, r[f.k] || '']))));
    ws['!cols'] = F.map(f => ({ wch: f.t === 'area' ? 45 : 22 })); const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(wb, ws, 'السجل'); XLSX.writeFile(wb, o.file + '.xlsx'); return;
  }
  // ── عرض الأعمدة (الخط العربي أعرض من اللاتيني ⇒ معامل 1.3) ──
  const wid = [6].concat(F.map(f => {
    let mx = f.l.length; for (const r of rows) { const L = String(r[f.k] || '').length; if (L > mx) mx = L; }
    return f.t === 'area' ? 52 : Math.min(Math.max(Math.ceil(mx * 1.3) + 6, 15), 34);
  }));
  const totalPx = wid.reduce((s, w) => s + Math.round(w * 7 + 5), 0);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('السجل', { views: [{ rightToLeft: true, showGridLines: false }], pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.3, footer: 0.3 } }, headerFooter: { oddFooter: '&C&"Arial,Regular"&9&P / &N' } });
  wid.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  const FONT = 'Arial', thin = { style: 'thin', color: { argb: 'FF94A3B8' } }, bd = { top: thin, left: thin, bottom: thin, right: thin };
  const line = (r, text, size, bold, color, h) => { ws.mergeCells(r, 1, r, n); const c = ws.getCell(r, 1); c.value = text; c.font = { name: FONT, size, bold, color: { argb: color } }; c.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' }; ws.getRow(r).height = h; };
  // ── 1) الشعار (كما في الطباعة) ──
  ws.getRow(1).height = 20;
  const logo = (typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) ? MINISTRY_LOGO_B64 : '';
  const ext = /^data:image\/[\w.+-]+;base64,\/9j\//.test(logo) ? 'jpeg' : /^data:image\/[\w.+-]+;base64,iVBOR/.test(logo) ? 'png' : /^data:image\/[\w.+-]+;base64,R0lGOD/.test(logo) ? 'gif' : '';
  if (ext) {
    try {
      const sz = await pgImgSize(logo); let lh = 100, lw = lh * sz.w / sz.h; if (lw > totalPx - 20) { lw = totalPx - 20; lh = lw * sz.h / sz.w; }
      let x = (totalPx - lw) / 2, col = 0; while (col < n - 1 && x >= Math.round(wid[col] * 7 + 5)) { x -= Math.round(wid[col] * 7 + 5); col++; }
      ws.addImage(wb.addImage({ base64: logo, extension: ext }), { tl: { col: col + x / Math.round(wid[col] * 7 + 5), row: 0.08 }, ext: { width: lw, height: lh }, editAs: 'oneCell' });
      ws.getRow(1).height = Math.ceil(lh * 0.75) + 8;
    } catch (e) { console.warn('logo', e); }
  }
  line(2, dir, 12, true, 'FF000000', 22); line(3, inst, 12, true, 'FF000000', 22);
  line(4, title, 16, true, 'FF1A3A5C', 30);
  line(5, 'عدد السجلات: ' + rows.length + ' — بتاريخ ' + dateStr, 10, false, 'FF475569', 20);
  ws.getRow(6).height = 6;
  // ── 2) رأس الجدول ──
  const HR = 7, hr = ws.getRow(HR); hr.height = 28;
  ['#'].concat(F.map(f => f.l)).forEach((h, i) => { const c = hr.getCell(i + 1); c.value = h; c.font = { name: FONT, size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A5C' } }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'rtl' }; c.border = bd; });
  // ── 3) الصفوف ──
  rows.forEach((r, i) => {
    const vals = F.map(f => String(r[f.k] || '')), row = ws.addRow([i + 1].concat(vals));
    let lines = 1; vals.forEach((v, j) => { const per = Math.max(wid[j + 1] * 0.85, 8), L = v.split('\n').reduce((t, p) => t + Math.max(1, Math.ceil(p.length / per)), 0); if (L > lines) lines = L; });
    row.height = Math.max(24, lines * 17 + 7);
    row.eachCell({ includeEmpty: true }, (c, ci) => {
      const f = F[ci - 2], isText = f && (f.t === 'area' || (!f.t && !f.opts && f.k !== 'massar' && f.k !== 'cls' && f.k !== 'cin'));
      c.font = { name: FONT, size: 11 }; c.border = bd; c.numFmt = '@';
      c.alignment = isText ? { horizontal: 'right', vertical: 'middle', wrapText: true, indent: 1, readingOrder: 'rtl' } : { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: ci === 1 ? 'ltr' : 'rtl' };
      if (i % 2) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    });
  });
  if (!rows.length) { const r = ws.addRow(['لا توجد سجلات.']); ws.mergeCells(r.number, 1, r.number, n); r.getCell(1).alignment = { horizontal: 'center' }; r.getCell(1).font = { name: FONT, size: 11, color: { argb: 'FF64748B' } }; r.height = 26; }
  // ── 4) التوقيعات ──
  const sr = ws.rowCount + 3, half = Math.max(1, Math.floor(n / 2));
  ws.mergeCells(sr, 1, sr, half); ws.mergeCells(sr, half + 1, sr, n);
  [[1, 'المختص الاجتماعي'], [half + 1, 'مدير المؤسسة']].forEach(([c, t]) => { const x = ws.getCell(sr, c); x.value = t; x.font = { name: FONT, size: 11, bold: true }; x.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' }; });
  ws.getRow(sr).height = 24;
  ws.views = [{ rightToLeft: true, showGridLines: false, state: 'frozen', ySplit: HR }];
  ws.autoFilter = { from: { row: HR, column: 1 }, to: { row: HR, column: n } };
  ws.pageSetup.printTitlesRow = HR + ':' + HR; ws.pageSetup.printArea = 'A1:' + ws.getColumn(n).letter + sr;
  const buf = await wb.xlsx.writeBuffer();
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  a.download = o.file + '.xlsx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function applyPhoto() {
  const p = userProfile && userProfile.photo;
  document.querySelectorAll('#profileInfoAvatar,#userInitial,.bb-avatar').forEach(e => {
    e.style.backgroundImage = p ? 'url("' + p + '")' : ''; e.style.backgroundSize = 'cover'; e.style.backgroundPosition = 'center';
    e.style.color = p ? 'transparent' : ''; if (p) e.style.borderRadius = '50%';
  });
}
// اختيار الصورة وحذفها صارا في React (src/profile) ويمرّان بـ __legacyBridge.saveProfile

// (اسم المديرية والمؤسسة وقوائم الأقسام: updateDirectorateUI وgetDirectorate وgetInstitutionName وapplyInstitutionEverywhere وgetImportedClasses وbuildLevelOptions وupdateAllLevelSelects صارت في src/institution وتُسجَّل على window قبل تحميل هذا السكربت)


function updateDashboardStats() {
  try {
    // بطاقات الإحصائيات والمخطط الشهري صارت مكوّنات React (src/home) تقرأ من المخزن؛
    // نكتفي هنا بإبلاغها بإعادة القراءة (عدد التلاميذ أيضاً صار من المخزن).
    window.dispatchEvent(new Event('legacy:stats-refresh'));

  } catch(e) { console.warn('Dashboard stats error:', e); }
}

// تاريخ اللوحة وعدد التلاميذ وشريط المستخدم: صارت مكوّنات React (src/header)

// ══════════════════════════════════════════════════
// 🔔 showToast — انتقلت إلى React (src/ui)؛ تُسجَّل على window.showToast فتستدعيها دوال الحفظ هنا بالاسم
// ══════════════════════════════════════════════════

function authEnterApp() {


     // Load this user's student list from Firebase
  if (currentUser) {
    storageGet(currentUser + ':customStudents', true).then(result => {
      if (result && result.value) {
        try {
          const list = JSON.parse(result.value);
          const key = 'app:customStudents:' + currentUser;
          localStorage.setItem(key, JSON.stringify(list));
          StudentDb.mergeCustom(list);
        } catch(e) {}
      }
    }).then(() => window.dispatchEvent(new Event('legacy:students-changed'))).catch(() => {});
  }
  window.dispatchEvent(new CustomEvent('legacy:entered', { detail: { user: currentUser } }));
  // إظهار البوابة الرئيسية
  document.getElementById('portalLanding').style.display = 'block';
  loadSiteConfig();
  applyPhoto();
  const bar = document.getElementById('userBar');
  bar.classList.add('visible');
  // Show search + notif bar
  const searchBar = document.getElementById('searchNotifBar');
  if (searchBar) searchBar.style.display = 'flex';
  const initials = (userProfile.fullName || currentUser).charAt(0).toUpperCase();
  // تحديث شريط المستخدم في back-bar جميع الأدوات
  const displayName = userProfile.fullName || currentUser;
  document.querySelectorAll('.bb-avatar').forEach(el => el.textContent = initials);
  document.querySelectorAll('.bb-name').forEach(el => el.textContent = displayName);
  window.dispatchEvent(new CustomEvent('legacy:sync-status', { detail: { cloud: !!STORAGE_IS_CLOUD } }));
  const note = document.getElementById('authStorageNote');
  if (note) note.textContent = STORAGE_IS_CLOUD ? '☁️ وضع Firebase Firestore — بياناتك محفوظة في السحابة ومتاحة من أي جهاز' : '💾 وضع التخزين المحلي — يرجى إعداد Firebase للتخزين السحابي';
  // Save session so user stays logged in
  sessionSave(currentUser);
  // Initialize app
  const abCountEl = document.getElementById('abArchiveCount');
  if (abCountEl) abCountEl.textContent = getAbArchive().length;
  // Inject custom students into STUDENT_DB so search works
  setTimeout(() => {
    try {
      const custom = getCustomStudents();
      if (custom.length) StudentDb.mergeCustom(custom);
    } catch(e) {}
  }, 500);
  // Update portal dashboard stats — نؤخر الاستدعاء لضمان اكتمال تحميل البيانات من Firebase
  setTimeout(updateDashboardStats, 800);
  setTimeout(updateDashboardStats, 2500);
  // Update directorate name everywhere
  setTimeout(updateDirectorateUI, 250);
  // Update level selects based on institution cycle
  setTimeout(updateAllLevelSelects, 300);
  [900, 2500].forEach(ms => setTimeout(function(){ try { updateAllLevelSelects(); applyInstitutionEverywhere(); } catch(e) {} }, ms));
  // Update Firebase status display
  setTimeout(() => {
    fbUpdateStatus();
    // حالة Firebase في الإعدادات يرسمها React (تصلها من حدث legacy:sync-status)
  }, 800);
}


// ═══════════════════════════════════════════════════
//  🔥 FIREBASE SETUP MANAGER — إدارة إعداد Firebase
// ═══════════════════════════════════════════════════

// نافذة إعداد Firebase (الحقول واللصق والحفظ والاختبار والحذف) وزر الدخول صارت React: src/firebase-setup.
// بقيت هنا الدوال التي تستدعيها أزرار قديمة بالاسم: فتح النافذة وإغلاقها وبثّ حالة Firebase.
function openFirebaseSetup() {
  document.getElementById('firebaseSetupModal').classList.add('open');
  window.dispatchEvent(new Event('legacy:firebase-setup-open'));
  fbUpdateStatus();
}

function closeFirebaseSetup() {
  document.getElementById('firebaseSetupModal').classList.remove('open');
}

function fbUpdateStatus() {
  const status = window._firebaseStatus || 'not_configured';
  // شريط الحالة وزر الدخول والإعدادات يرسمها React (تصلها من هذا الحدث)؛ والرأس يستعمله أيضاً
  window.dispatchEvent(new CustomEvent('legacy:sync-status', { detail: { cloud: status === 'connected', status } }));
}

// Also add Firebase setup button to settings modal
function openFirebaseSetupFromSettings() {
  closeSettings();
  openFirebaseSetup();
}

function authLogout() {
  if (!confirm('هل تريد تسجيل الخروج؟\nستبقى بياناتك محفوظة ويمكنك الدخول مجدداً.')) return;
  // تنظيف قائمة التلاميذ من الذاكرة واللوكال ستوراج قبل الخروج
  try { if (currentUser) localStorage.removeItem('app:customStudents:' + currentUser); } catch(e) {}
  try { localStorage.removeItem('app:customStudents'); } catch(e) {}
  StudentDb.clear();
  try { if (window._fbAuth) window._fbAuth.logout(); } catch(e) {}
  sessionClear();
  currentUser = null; userProfile = {};
  appData.interviewArchive = []; appData.reintegrationArchive = [];
  appData.absenceArchive = []; appData.taskLog = []; appData.contactsArchive = []; appData.workshopsArchive = []; appData.vigilanceCases = []; appData.behaviorFiles = []; appData.pdAssocArchive = []; appData.pdHealthArchive = [];
  document.getElementById('userBar').classList.remove('visible');
  const searchBar = document.getElementById('searchNotifBar');
  if (searchBar) searchBar.style.display = 'none';
  // شاشة الدخول يديرها React (src/auth) — نُبلغها بالخروج فتظهر وتفرّغ الحقول
  window.dispatchEvent(new Event('legacy:loggedout'));
}

// ── جسر بين React والكود القديم ──
// المتغيرات currentUser / STORAGE_IS_CLOUD معرَّفة بـ let داخل هذا السكربت،
// فلا يستطيع React تعديلها مباشرة؛ لذلك نوفّر هذه الدوال فقط.
window.__legacyBridge = {
  setCloud(v) { STORAGE_IS_CLOUD = !!v; },
  async startSession(name) {
    currentUser = name;
    await loadUserData();
    authEnterApp();
  },
  // ── قراءة/كتابة البيانات لمخزن React (src/store) ──
  getUser() { return currentUser; },
  getProfile() { return userProfile; },
  getAppData() { return appData; },
  getStudents() { return StudentDb.list(); },
  getStudentsRaw() { return getCustomStudents(); },
  // يكتب مجموعة كاملة ثم يحفظها بنفس المسار القديم (saveUserKey) فيصل الإشعار لكل المشتركين
  saveCollection(key, items) {
    if (!(key in appData)) throw new Error('مجموعة غير معروفة: ' + key);
    appData[key] = items;
    return saveUserKey(key);
  },
  saveStudents(list) { saveCustomStudents(list); },
  // حفظ الملف الشخصي من نافذة React (src/profile). patch.photo === null يحذف الصورة.
  // effects=false للحفظ الصامت (مثل التحقق من الهاتف) بلا إعادة بناء المديرية والأقسام.
  async saveProfile(patch, opts) {
    Object.keys(patch || {}).forEach(k => { if (patch[k] === null) delete userProfile[k]; else userProfile[k] = patch[k]; });
    await storageSet(currentUser + ':profile', JSON.stringify(userProfile), true);
    window.dispatchEvent(new Event('legacy:profile-changed'));
    if (!opts || opts.effects !== false) {
      updateDirectorateUI();
      updateAllLevelSelects();
      applyInstitutionEverywhere();
      applyPhoto();
    }
  }
};

// ── Profile ──
// نافذة الحساب الشخصي صارت مكوّن React (src/profile/ProfileModal.jsx)، وopenProfile/closeProfile (مع تغليف الهاتف) صارتا في src/profile/profileWindow.js وتُسجَّلان على window قبل تحميل هذا السكربت.

// ── OTP / Phone Verification ──
let _otpCode = '';
let _otpTimer = null;
let _otpPhone = '';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function startOTPCountdown(elId, seconds) {
  const el = document.getElementById(elId);
  if (!el) return;
  let s = seconds;
  if (_otpTimer) clearInterval(_otpTimer);
  _otpTimer = setInterval(() => {
    const m = Math.floor(s/60), sec = s%60;
    el.textContent = `⏱ صلاحية الرمز: ${m}:${sec.toString().padStart(2,'0')}`;
    s--;
    if (s < 0) {
      clearInterval(_otpTimer);
      _otpCode = '';
      el.textContent = '⚠️ انتهت صلاحية الرمز. اضغط إرسال مجدداً.';
    }
  }, 1000);
}

// Send OTP via WhatsApp (CallMeBot free API) or fallback SMS hint
async function sendOTPViaWhatsApp(phone, code) {
  // CallMeBot WhatsApp API (free, requires one-time activation by user)
  // User must first send "I allow callmebot to send me messages" to +34 644 600 695
  const msg = encodeURIComponent(`🔐 منصة التوثيق المهني\nرمز التحقق الخاص بك:\n*${code}*\nصالح لمدة دقيقتين. لا تشاركه مع أحد.`);
  const apikey = 'YOUR_CALLMEBOT_APIKEY'; // يحتاج تفعيل مرة واحدة
  // Normalize phone: remove leading 0, add country code 212 for Morocco
  let normalizedPhone = phone.replace(/^0/, '212').replace(/[\s\-+]/g,'');
  const url = `https://api.callmebot.com/whatsapp.php?phone=${normalizedPhone}&text=${msg}&apikey=${apikey}`;

  try {
    // Try WhatsApp via CallMeBot
    const resp = await fetch(url, { method: 'GET', mode: 'no-cors' });
    return { channel: 'whatsapp', success: true };
  } catch(e) {
    return { channel: 'whatsapp', success: false };
  }
}

async function sendOTPViaSMS(phone, code) {
  // SMS via fast2sms or similar — replace with your provider
  // This is a placeholder — integrate your SMS API here
  return { channel: 'sms', success: false };
}

async function dispatchOTP(phone, code, statusElId) {
  const el = document.getElementById(statusElId);
  if (el) el.textContent = '⏳ جارٍ إرسال رمز التحقق...';

  // Try WhatsApp first
  const waResult = await sendOTPViaWhatsApp(phone, code);
  if (waResult.success) {
    if (el) el.textContent = '✅ تم إرسال الرمز عبر واتساب 📱';
    return;
  }

  // Fallback: SMS
  const smsResult = await sendOTPViaSMS(phone, code);
  if (smsResult.success) {
    if (el) el.textContent = '✅ تم إرسال الرمز عبر SMS 📨';
    return;
  }

  // Final fallback: show in UI (dev mode only)
  if (el) el.innerHTML = `⚠️ <span style="color:#92400e;font-size:0.75rem;">لم يكتمل الإرسال التلقائي — رمزك: <strong style="font-size:1rem;letter-spacing:3px;color:#1a3a5c;">${code}</strong><br><small>لتفعيل الإرسال التلقائي: أرسل "I allow callmebot to send me messages" لـ +34644600695 على واتساب، ثم أدخل الـ API key في الكود.</small></span>`;
}

function authSendOTP() {
  const phone = document.getElementById('authRegPhone')?.value.trim();
  if (!phone || phone.length < 8) { alert('⚠️ يرجى إدخال رقم هاتف صحيح أولاً.'); return; }
  _otpPhone = phone;
  _otpCode = generateOTP();
  document.getElementById('authOTPSection').style.display = 'block';
  startOTPCountdown('authOTPCountdown', 120);
  dispatchOTP(phone, _otpCode, 'authOTPCountdown');
  const btn = document.getElementById('authSendOTPBtn');
  if (btn) { btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 30000); }
}

function authVerifyOTP() {
  const input = document.getElementById('authOTPInput')?.value.trim();
  if (!_otpCode) { alert('⚠️ الرمز منتهي الصلاحية. اضغط إرسال مجدداً.'); return; }
  if (input === _otpCode) {
    _otpCode = '';
    if (_otpTimer) clearInterval(_otpTimer);
    document.getElementById('authOTPCountdown').textContent = '✅ تم التحقق بنجاح!';
    document.getElementById('authOTPSection').style.display = 'none';
    const btn = document.getElementById('authSendOTPBtn');
    if (btn) { btn.textContent = '✅ مُحقَّق'; btn.style.background = '#16a34a'; btn.disabled = true; }
  } else {
    alert('❌ الرمز غير صحيح. تحقق من رسالة واتساب أو SMS وأعد المحاولة.');
  }
}

// التحقق من هاتف الحساب الشخصي صار في React (src/profile)؛ authSendOTP/authVerifyOTP أعلاه للتسجيل وتبقى كما هي

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the week range badge on main page
  setTimeout(() => { if (typeof wpInitMainBadge === 'function') wpInitMainBadge(); }, 100);
  // Initialize institution logo from storage
  setTimeout(() => { if (typeof initLogoFromStorage === 'function') initLogoFromStorage(); }, 200);
});

// ── Settings ──

// ══════════════════════════════════════════════════════════════
//  🖼️ LOGO MANAGEMENT — إدارة شعار المؤسسة
// ══════════════════════════════════════════════════════════════
// تطبيق الشعار وحفظه وحذفه وقراءته عند الإقلاع، مع printLogoImg و_refreshLogoImages وwindow._reportLogoHTML،
// انتقلت إلى React: src/settings/logoStore.js (وثابت الشعار الافتراضي في defaultLogo.js).
// تبقى أسماؤها عامة (window.applyLogo ...) فيستدعيها هذا الكود وبقية الوحدات كما كانت.

// نافذة الإعدادات (المظهر وحالة Firebase) صارت مكوّن React: src/settings/SettingsModal.jsx.
// نُبقي الدالتين لأن أزرار كثيرة تستدعيهما بالاسم؛ أما قسما الشعار وقائمة التلاميذ فما زالا HTML قديماً.
function openSettings() {
  window.dispatchEvent(new Event('legacy:settings-open'));
  document.getElementById('settingsModal').classList.add('open');
  // Refresh logo preview
  try { initLogoFromStorage(); } catch(e) {}
}

function closeSettings() { document.getElementById('settingsModal').classList.remove('open'); }

// ── Student List Management (Settings) ──
// The app uses a global STUDENTS array — we piggyback on it
function getStudentsList() {
  // Try to access the main students array used for autocomplete
  if (typeof STUDENTS !== 'undefined' && Array.isArray(STUDENTS)) return STUDENTS;
  // Fallback: get from localStorage
  try {
    const v = localStorage.getItem('app:customStudents');
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}

function saveCustomStudents(list) {
  const key = currentUser ? 'app:customStudents:' + currentUser : 'app:customStudents';
  try { localStorage.setItem(key, JSON.stringify(list)); } catch(e) {}
  if (currentUser) {
    storageSet(currentUser + ':customStudents', JSON.stringify(list), true).catch(() => {});
  }
  // تحديث STUDENT_DB مباشرة في الذاكرة
  try {
    StudentDb.replaceFromCustom(list);
  } catch(e) {}
  // تحديث قوائم الأقسام من اللائحة الجديدة
  try { updateAllLevelSelects(); } catch(e) {}
  // تحديث عداد التلاميذ في لوحة القيادة
  if (typeof updateDashboardStats === 'function') setTimeout(updateDashboardStats, 100);
  window.dispatchEvent(new Event('legacy:students-changed'));
}

function getCustomStudents() {
  const key = currentUser ? 'app:customStudents:' + currentUser : 'app:customStudents';
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : []; } catch { return []; }
}

// قسم قائمة التلاميذ في الإعدادات (الإضافة اليدوية، البحث والحذف المحدَّد، اقتراحات القسم) صار في React: src/settings/StudentsSection.jsx
// (والنسخة الاحتياطية والاستعادة وحذف القائمة كاملة أيضاً)؛ بقيت هنا getCustomStudents/saveCustomStudents لأن بقية الكود يستدعيهما.

// (printStudentList انتقلت إلى src/students/studentList.js — ورقة لكل قسم بجدول مسار/النسب/الاسم/الجنس/الازدياد، وتُسجَّل على window)

// تصدير لائحة التلاميذ إلى Excel واستيرادها من Excel/CSV صارا في React (الخطوة 44):
// src/students/studentExport.js وsrc/students/studentImport.js، والأزرار في src/settings/StudentsSection.jsx.

// نافذة «معاينة وتعديل التقرير الأسبوعي» ونافذة تعديل السجل صارتا في React (src/weeklypreview، الخطوة 40):
// openWeeklyReportPreview وwprClose تُسجَّلان على window من installWeeklyPreview (يستدعيهما الكود القديم والبلاطات).
// الجسر أدناه هو ما تحتاجه النافذة من الكود القديم: قراءة الأرشيفات وحفظها (appData ثابت const لا تراه الوحدات).
var WPR_ARCHIVES = {
  interview:     { get: function(){ return typeof getArchive   === 'function' ? getArchive()   : []; }, save: function(a){ if (typeof saveArchive   === 'function') saveArchive(a);   } },
  reintegration: { get: function(){ return typeof getRArchive  === 'function' ? getRArchive()  : []; }, save: function(a){ if (typeof saveRArchive  === 'function') saveRArchive(a);  } },
  absence:       { get: function(){ return typeof getAbArchive === 'function' ? getAbArchive() : []; }, save: function(a){ if (typeof saveAbArchive === 'function') saveAbArchive(a); } },
  violence:      { get: function(){ return typeof getVioArchive === 'function' ? getVioArchive() : []; }, save: function(a){ if (typeof saveVioArchive === 'function') saveVioArchive(a); } },
  workshop:      { get: function(){ return (appData && appData.workshopsArchive) ? appData.workshopsArchive : []; }, save: function(a){ if (appData) { appData.workshopsArchive = a; if (typeof saveUserKey === 'function') saveUserKey('workshopsArchive'); } } },
  specNeeds:     { get: function(){ return typeof getSnArchive === 'function' ? getSnArchive() : []; }, save: function(a){ if (typeof saveSnArchive === 'function') saveSnArchive(a); } }
};
window.wprBridge = {
  collections: function(){ return wkCollections(); },
  get: function(type){ return WPR_ARCHIVES[type] ? WPR_ARCHIVES[type].get() : []; },
  save: function(type, arr){ if (WPR_ARCHIVES[type]) WPR_ARCHIVES[type].save(arr); },
  refreshStats: function(){ if (typeof updateDashboardStats === 'function') updateDashboardStats(); }
};

// ======= WEEK PICKER MODAL =======
// openWeekPickerModal وcloseWeekPickerModal صارتا في React (src/weekpicker) وتُسجَّلان على window قبل تحميل هذا السكربت

function wpGetWeekRange(offsetWeeks) {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0) ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff + (offsetWeeks * 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    from: mon.toISOString().slice(0,10),
    to:   sun.toISOString().slice(0,10)
  };
}

// wpSetDates وwpSet*Week وwpSyncToDate وwpUpdatePreview وwpGenerateReport صارت في React (src/weekpicker/WeekPickerModal.jsx)

function wpUpdateMainBadge(from, to) {
  // شارة الأسبوع في بطاقة التقرير صارت مكوّن React (src/home/WeeklyReportCard.jsx)؛ نرسل لها الأسبوع المحدد
  window.dispatchEvent(new CustomEvent('legacy:week-range', { detail: { from, to } }));
}

function wpInitMainBadge() {
  let from, to;
  try { from = localStorage.getItem('wp:selectedFrom'); to = localStorage.getItem('wp:selectedTo'); } catch {}
  if (!from || !to) { const r = wpGetWeekRange(0); from = r.from; to = r.to; }
  wpUpdateMainBadge(from, to);
}

// ======= WEEKLY REPORT → WORD (نفس آلية بقية البوابات) =======
// جمع صفوف الأسبوع وبناء HTML التقرير صارا في src/weekly/weeklyReport.js (window.WeeklyReport)؛ هنا فقط قراءة الأرشيفات من الكود القديم.
function wkCollections() {
  return {
    interviewArchive:     typeof getArchive === 'function' ? getArchive() : [],
    reintegrationArchive: typeof getRArchive === 'function' ? getRArchive() : [],
    absenceArchive:       typeof getAbArchive === 'function' ? getAbArchive() : [],
    specialNeedsArchive:  typeof getSnArchive === 'function' ? getSnArchive() : [],
    violenceArchive:      typeof getVioArchive === 'function' ? getVioArchive() : [],
    workshopsArchive:     (appData && appData.workshopsArchive) ? appData.workshopsArchive : [],
    // بوابة الاتصال بالأولياء (الخطوة 38): الهاتف والمقابلات
    parentCalls:          (appData && appData.parentCalls) ? appData.parentCalls : [],
    parentMeetings:       (appData && appData.parentMeetings) ? appData.parentMeetings : []
  };
}

function wkBuildRows(fromDate, toDate) {
  return WeeklyReport.buildRows(wkCollections(), fromDate, toDate);
}

function wkReportHtml(fromDate, toDate) {
  const logo = (typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) ? MINISTRY_LOGO_B64 : '';
  return WeeklyReport.buildReportHtml(wkBuildRows(fromDate, toDate), fromDate, toDate, logo);
}

// الطباعة والتصدير إلى Word صارا في src/weekly/weeklyPrint.js (window.WeeklyPrint)
async function downloadWeeklyReportWordForRange(fromDate, toDate) {
  await WeeklyPrint.exportWeeklyWord(wkReportHtml(fromDate, toDate), fromDate, toDate);
}

function printWeeklyReportForRange(fromDate, toDate) {
  WeeklyPrint.printWeeklyReport(wkReportHtml(fromDate, toDate));
}

// المظهر المحفوظ يُطبَّق عند بدء التطبيق من src/main.jsx

// الإشعارات (مواعيد المتابعة القادمة) وجدول التتبع الشهري وطباعته صارت في src/tracking (الخطوة 45):
// trackingLogic.js (المنطق) وtrackingPrint.js (الطباعة) وTrackingModals.jsx (الواجهة). لم يبقَ هنا شيء منها.

// ── Key press support ──
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeProfile(); }
});

const ARCHIVE_KEY = 'interviewArchive_v1';
function getArchive() { return appData.interviewArchive; }
function saveArchive(data) { appData.interviewArchive = data; saveUserKey('interviewArchive'); }

// ── المقابلات الفردية: انتقلت إلى React (src/interview). تبقى دالتا القراءة/الحفظ فقط لأن التقرير الأسبوعي يقرأ الأرشيف بهما،
//    (نافذة «سجل التلميذ» المشتركة صارت في src/history) ──

// (نافذة «سجل التلميذ» — مقابلات وإدماج — انتقلت إلى React: src/history)

// ── الإدماج المدرسي: انتقل إلى React (src/reintegration). تبقى دالتا القراءة/الحفظ لأن التقرير الأسبوعي يقرأ الأرشيف بهما،
//    (نافذة «سجل التلميذ» المشتركة صارت في src/history) ──
function getRArchive() { return appData.reintegrationArchive; }
function saveRArchive(data) { appData.reintegrationArchive = data; saveUserKey('reintegrationArchive'); }
