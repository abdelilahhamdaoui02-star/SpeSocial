// الإكمال التلقائي لأسماء التلاميذ — وحدة ES منقولة من script-15.js (acSearch/acFillField/acSetup/acSelect/AUTOCOMPLETE_FIELDS/initAllAutocomplete).
// قائمة التلاميذ STUDENT_DB ما زالت يملكها الكود القديم (script-10 يملأها ويفرّغها)؛ نقرؤها دائماً عبر الجسر
// فنرى المصفوفة نفسها (window.__legacyBridge.getStudents/getProfile). تُسجَّل الدوال على window
// لأن القائمة المنسدلة تستعمل onclick="acSelect(...)" داخل HTML مولَّد.
import { acNormalize } from '../absence/absenceLogic.js';
import { getBridge } from '../session/sessionBridge.js';
import { cleanClassValue } from '../students/cleanClass.js';
import { normalizeDob, isIsoDob } from '../students/studentList.js';

// القائمة والملف الشخصي من جسر الجلسة (src/store يقرأ منه أيضاً) بدل المتغيرات العامة
const bridge = () => getBridge();
const studentDb = () => { const b = bridge(); const l = b && b.getStudents ? b.getStudents() : []; return Array.isArray(l) ? l : []; };
const userProfile = () => { const b = bridge(); return (b && b.getProfile ? b.getProfile() : null) || null; };

export function acSearch(query) {
  const q = acNormalize(query).toLowerCase();
  if (!q || q.length < 2) return [];
  return studentDb().filter(s => {
    const full = acNormalize(s.fullName).toLowerCase();
    const fn = acNormalize(s.firstName).toLowerCase();
    const ln = acNormalize(s.lastName).toLowerCase();
    const ms = (s.massar||'').toLowerCase();    return full.includes(q) || fn.includes(q) || ln.includes(q) || ms.startsWith(q);
  }).slice(0, 15);
}

// تاريخ الازدياد → حقل <input type="date">: يُطبَّع أولاً (قوائم قديمة مخزَّنة بصيغ مثل 15/03/2008 لا يقبلها الحقل)،
// ويُفرَّغ الحقل إن لم يكن للتلميذ المختار تاريخ صالح كي لا يبقى تاريخ التلميذ السابق على وثيقة الجديد؛
// ويُطلَق input/change ليلتقط أي مستمع (نماذج React) القيمة الجديدة
export function fillDob(el, dob) {
  if (!el) return;
  const iso = normalizeDob(dob);
  const next = isIsoDob(iso) ? iso : '';
  if (el.value === next) return;
  el.value = next;
  ['input', 'change'].forEach((type) => el.dispatchEvent(new Event(type, { bubbles: true })));
}
// كتابة قيمة في حقل بطريقة يلتقطها React أيضاً (الحقول المتحكَّم بها تتجاهل el.value المباشر)
function setInputValue(el, v) {
  if (!el) return;
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
export function acFillField(cfg, student) {
  const nameEl = document.getElementById(cfg.nameId);
  if (nameEl) nameEl.value = student.fullName;
  if (cfg.massarId) { const el = document.getElementById(cfg.massarId); if (el) el.value = student.massar || ''; }
  if (cfg.dobId) fillDob(document.getElementById(cfg.dobId), student.dob);
  if (cfg.phoneId) setInputValue(document.getElementById(cfg.phoneId), student.phone || '');  if (cfg.schoolId) {
    const el = document.getElementById(cfg.schoolId);
    const profile = userProfile();
    const inst = (profile && profile.institution) ? profile.institution : (student.school || '');
    if (el && inst) el.value = inst;
  }
  if (cfg.levelId) {
    const el = document.getElementById(cfg.levelId);
    if (el) {
      if (el.tagName === 'SELECT') {
        const target = cleanClassValue(student.class);
        if (target) {
          const nz = v => String(v || '').replace(/[\s\-_–—]+/g, '').toUpperCase();
          let found = null;
          for (const opt of el.options) { if (opt.value === target) { found = opt; break; } }
          if (!found) for (const opt of el.options) { if (opt.value && nz(opt.value) === nz(target)) { found = opt; break; } }
          if (!found) {
            let og = el.querySelector('optgroup[data-ac="1"]');
            if (!og) { og = document.createElement('optgroup'); og.label = '📥 من قائمة التلاميذ'; og.setAttribute('data-ac', '1'); el.appendChild(og); }
            found = document.createElement('option'); found.value = target; found.textContent = target; og.appendChild(found);
          }
          el.value = found.value;
        }
      } else {
        el.value = student.class || '';
      }
    }
  }
  if (cfg.genderName && student.gender) {
    document.querySelectorAll(`input[name="${cfg.genderName}"]`).forEach(r => {
      r.checked = r.value === student.gender;
    });
  }
}

export function acSetup(cfg) {
  const input = document.getElementById(cfg.nameId);
  if (!input || input._acReady) return;
  input._acReady = true;
  if (!input.parentElement.classList.contains('student-autocomplete-wrapper')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'student-autocomplete-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    const dropdown = document.createElement('div');
    dropdown.className = 'student-autocomplete-dropdown';
    dropdown.id = cfg.nameId + '_dropdown';
    wrapper.appendChild(dropdown);
  }
  const dropdown = document.getElementById(cfg.nameId + '_dropdown');
  let selIdx = -1;

  const currentPh = input.getAttribute('placeholder') || '';
  if (!currentPh.includes('ابدأ بالكتابة')) {
    input.setAttribute('placeholder', currentPh + ' (ابدأ بالكتابة للبحث في القائمة...)');
  }
  input.setAttribute('autocomplete', 'off');

  input.addEventListener('input', () => {
    const results = acSearch(input.value);
    selIdx = -1;
    if (!results.length) {
      dropdown.innerHTML = input.value.length >= 2 ? '<div class="ac-no-results">🔍 لا توجد نتائج</div>' : '';
      dropdown.classList.toggle('open', input.value.length >= 2);
      return;
    }
    dropdown.innerHTML = results.map((s,i) => `
      <div class="autocomplete-item" data-idx="${i}" onclick="acSelect(this,'${cfg.nameId}')">
        <span class="ac-gender">${s.gender === 'أنثى' ? '👩' : '👦'}</span>
        <span class="ac-name">${s.fullName}</span>
        <span class="ac-class">${s.class}</span>
        <span class="ac-meta" style="font-size:0.7rem;color:#94a3b8;">${s.massar}</span>
      </div>`).join('');
    dropdown._results = results;
    dropdown._cfg = cfg;
    dropdown.classList.add('open');
  });

  // ── ملء القسم/الرقم تلقائياً عند كتابة أو لصق اسم يطابق تلميذاً في اللائحة (بدون الضغط على القائمة) ──
  const wordKey = v => acNormalize(v).toLowerCase().split(' ').filter(Boolean).sort().join(' ');
  function tryExactFill() {
    const k = wordKey(input.value);
    if (!k || k.length < 3) return;
    const matches = studentDb().filter(s => wordKey(s.fullName) === k);
    if (matches.length === 1) {
      acFillField(cfg, matches[0]);
      dropdown.classList.remove('open');
    }
  }
  input.addEventListener('input', tryExactFill);
  input.addEventListener('change', tryExactFill);
  input.addEventListener('blur', () => setTimeout(tryExactFill, 150));

  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (!dropdown.classList.contains('open') || !items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); selIdx = Math.min(selIdx+1, items.length-1); items.forEach((el,i) => el.classList.toggle('active', i===selIdx)); items[selIdx]?.scrollIntoView({block:'nearest'}); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selIdx = Math.max(selIdx-1, 0); items.forEach((el,i) => el.classList.toggle('active', i===selIdx)); items[selIdx]?.scrollIntoView({block:'nearest'}); }
    else if (e.key === 'Enter' && selIdx >= 0) { e.preventDefault(); items[selIdx].click(); }
    else if (e.key === 'Escape') { dropdown.classList.remove('open'); }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('open');
  });
}

export function acSelect(el, nameId) {
  const dropdown = el.closest('.student-autocomplete-dropdown');
  const idx = parseInt(el.dataset.idx);
  const student = dropdown._results[idx];
  acFillField(dropdown._cfg, student);
  dropdown.classList.remove('open');
}

// ===== تعريف حقول الإكمال التلقائي لكل بوابة =====
export const AUTOCOMPLETE_FIELDS = [
  // بوابة المقابلات الفردية
  { nameId: 'i_studentName',  massarId: 'i_studentMassar', schoolId: 'i_school',  levelId: 'i_level',  genderName: 'i_gender' },
  // بوابة الإدماج المدرسي
  { nameId: 'r_studentName',  massarId: 'r_studentMassar', schoolId: 'r_school',  levelId: 'r_level',  genderName: 'r_gender' },
  // بوابة التلاميذ الأكثر غياباً
  { nameId: 'ab_studentName', massarId: 'ab_studentMassar',schoolId: 'ab_school', levelId: 'ab_level', genderName: 'ab_gender' },
  // بوابة التدخل في حالات العنف
  { nameId: 'vio_studentName',massarId: 'vio_massar',      schoolId: 'vio_school',levelId: 'vio_level' },
  { nameId: 'vio_agg_name',   massarId: 'vio_agg_massar',  levelId: 'vio_agg_level' },
  // بوابة الاتصالات وجلسات الأولياء
  { nameId: 'ct_studentName', massarId: 'ct_studentMassar',schoolId: 'ct_school', levelId: 'ct_level' },
  // بوابة وضعية الإعاقة وصعوبات التعلم
  { nameId: 'sn_studentName', massarId: 'sn_studentMassar',schoolId: 'sn_school', levelId: 'sn_level', genderName: 'sn_gender' },
  // ✅ بوابة خلية اليقظة — مع ربط المؤسسة والقسم ورقم مسار
  { nameId: 'vig_name', massarId: 'vig_massar', schoolId: 'vig_school', levelId: 'vig_level', genderName: 'vig_gender' },
  // ✅ بوابة رصد السلوك
  { nameId: 'bm_name', massarId: 'bm_massar', schoolId: 'bm_school', levelId: 'bm_level' },
  // ✅ بوابة طباعة الوثائق — نموذج الغياب
  { nameId: 'pd3-name', massarId: 'pd3-massar', schoolId: 'pd3-school', levelId: 'pd3-level', dobId: 'pd3-dob' },
  // ✅ بوابة طباعة الوثائق — وثيقة إخبار الحالة الصحية
  { nameId: 'pd4-name', massarId: 'pd4-massar', schoolId: 'pd4-school', levelId: 'pd4-level', dobId: 'pd4-dob' },
];

export function initAllAutocomplete() {
  AUTOCOMPLETE_FIELDS.forEach(cfg => acSetup(cfg));
}

if (typeof window !== 'undefined') {
  Object.assign(window, { acSearch, acFillField, fillDob, acSetup, acSelect, AUTOCOMPLETE_FIELDS, initAllAutocomplete });
}
