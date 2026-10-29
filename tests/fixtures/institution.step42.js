// مجمَّد من script-10.js قبل الخطوة 43 (إعدادات المنصة + المديرية + المؤسسة + قوائم الأقسام) — مرجع اختبار المطابقة فقط
const DEFAULT_MINISTRY = 'وزارة التربية الوطنية والتعليم الأولي والرياضة';
let SITE_CFG = {};
function getMinistry() { return ((SITE_CFG && SITE_CFG.ministry) || '').trim() || DEFAULT_MINISTRY; }
function _setTxt(el, v) { if (!el) return; if (el.dataset.def === undefined) el.dataset.def = el.textContent; el.textContent = (v || '').trim() || el.dataset.def; }
function applySiteConfig(cfg) {
  SITE_CFG = cfg || {};
  const g = SITE_CFG.gates || {};
  document.querySelectorAll('.dyn-ministry').forEach(e => { e.textContent = getMinistry(); });
  document.querySelectorAll('.hp-sub, .auth-title').forEach(e => _setTxt(e, SITE_CFG.platform));
  // بلاطات الصفحة الرئيسية وبطاقة الأخبار والميزاجور يرسمها React (src/portals وsrc/news وsrc/notice) → نبلغها بالأسماء المخصّصة وإعدادات الأخبار والإشعار
  window.dispatchEvent(new CustomEvent('legacy:site-config', { detail: { gates: g, news: SITE_CFG.news || {}, notice: SITE_CFG.notice || {} } }));
  try { updateDirectorateUI(); } catch (e) {}
}
// (بطاقة أخبار وقوانين المختصين صارت مكوّن React في src/news — المرحلة 9)
// (الميزاجور — إشعار التحديث — صار مكوّن React في src/notice؛ يصله من حدث legacy:site-config أدناه)
async function loadSiteConfig() {
  try { const c = localStorage.getItem('site:cfg'); if (c) applySiteConfig(JSON.parse(c)); } catch (e) {}
  try {
    await window._firebaseReady;
    const d = window._siteConfig && await window._siteConfig.get();
    if (d && d.json) { try { localStorage.setItem('site:cfg', d.json); } catch (e) {} applySiteConfig(JSON.parse(d.json)); }
  } catch (e) {}
}

// ── تحديث اسم المديرية في جميع أجزاء الواجهة ──
function updateDirectorateUI() {
  const dir = (userProfile && userProfile.school) ? userProfile.school : 'مديرية الحي الحسني';
  const kingdom = `المملكة المغربية — ${getMinistry()} — ${dir}`;
  const sub2 = `${getMinistry()} — ${dir}`;

  // الهيدر الرئيسي
  document.querySelectorAll('.dynamic-directorate').forEach(el => { el.textContent = dir; });
  // لوحة الترحيب
  const greetSub = document.getElementById('portalGreetingSub');
  if (greetSub) greetSub.textContent = `المختص الاجتماعي · ${dir}`;
  // بلوكات الطباعة (pm-directorate)
  document.querySelectorAll('.pm-directorate').forEach(el => { el.textContent = dir; });
  // kingdom lines في بلوكات الطباعة
  document.querySelectorAll('.dynamic-dir-kingdom').forEach(el => { el.textContent = kingdom; });
  // سطر وزارة التربية (p)
  document.querySelectorAll('.dynamic-dir-sub2').forEach(el => { el.textContent = sub2; });
  // سطر وزارة التربية (.sub)
  document.querySelectorAll('.dynamic-dir-sub3').forEach(el => { el.textContent = `🏛 ${sub2}`; });
  // سطر الإشعارات
  document.querySelectorAll('.dynamic-dir-oh-sub').forEach(el => { el.textContent = `${dir} — المصلحة الاجتماعية`; });
}

// دالة مساعدة لقراءة اسم المديرية الحالي
function getDirectorate() {
  return (userProfile && userProfile.school) ? userProfile.school : 'مديرية الحي الحسني';
}

// ══════════════════════════════════════════════════════════════
//  🎓 دوال قائمة الأقسام الدراسية — حسب السلك
// ══════════════════════════════════════════════════════════════

function buildCollegeOptions(n) {
  let o = '';
  for (let i = 1; i <= n; i++) o += `<option value="1APIC-${i}">1APIC-${i}</option>`;
  let o2 = '';
  for (let i = 1; i <= n; i++) o2 += `<option value="2APIC-${i}">2APIC-${i}</option>`;
  let o3 = '';
  for (let i = 1; i <= n; i++) o3 += `<option value="3APIC-${i}">3APIC-${i}</option>`;
  return `
    <optgroup label="🔷 السنة الأولى إعدادي">${o}</optgroup>
    <optgroup label="🔷 السنة الثانية إعدادي">${o2}</optgroup>
    <optgroup label="🔷 السنة الثالثة إعدادي">${o3}</optgroup>`;
}

function buildLyceeOptions() {
  return `
    <optgroup label="🔶 الجذع المشترك (Tronc Commun)">
      <option value="TC-Sciences">TC Sciences</option>
      <option value="TC-Lettre">TC Lettres</option>
      <option value="TC-Techno">TC Technologie</option>
      <option value="TC-Eco">TC Sciences Éco</option>
    </optgroup>
    <optgroup label="🔶 السنة الأولى بكالوريا">
      <option value="1BAC-SP">1BAC Sciences Physiques</option>
      <option value="1BAC-SVT">1BAC SVT</option>
      <option value="1BAC-Lettre">1BAC Lettres</option>
      <option value="1BAC-Eco">1BAC Éco</option>
      <option value="1BAC-Techno">1BAC Techno</option>
    </optgroup>
    <optgroup label="🔶 السنة الثانية بكالوريا">
      <option value="2BAC-PC">2BAC PC</option>
      <option value="2BAC-SVT">2BAC SVT</option>
      <option value="2BAC-SM">2BAC SM</option>
      <option value="2BAC-Lettre">2BAC Lettres</option>
      <option value="2BAC-Eco">2BAC Sciences Éco</option>
      <option value="2BAC-Techno">2BAC Techno</option>
    </optgroup>`;
}

function buildPrimaryOptions() {
  return `
    <optgroup label="🟢 ابتدائي">
      <option value="الأولى ابتدائي">الأولى ابتدائي</option>
      <option value="الثانية ابتدائي">الثانية ابتدائي</option>
      <option value="الثالثة ابتدائي">الثالثة ابتدائي</option>
      <option value="الرابعة ابتدائي">الرابعة ابتدائي</option>
      <option value="الخامسة ابتدائي">الخامسة ابتدائي</option>
      <option value="السادسة ابتدائي">السادسة ابتدائي</option>
    </optgroup>`;
}

// (cleanClassValue انتقلت إلى src/students/cleanClass.js وتُسجَّل على window)

// ── الأقسام المستخرجة من لائحة التلاميذ المستوردة ──
function getImportedClasses() {
  let list = [];
  try { if (StudentDb.count()) list = StudentDb.list(); } catch (e) {}
  if (!list.length) { try { list = getCustomStudents(); } catch (e) { list = []; } }
  const set = new Set();
  list.forEach(s => { const c = cleanClassValue(s && s.class); if (c) set.add(c); });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
}

// ── اسم المؤسسة (من الملف الشخصي الذي يتحدّث تلقائياً عند استيراد اللائحة) ──
var INSTITUTION_FIELD_IDS = ['i_school','r_school','ab_school','tl_school','vio_school','ws_school','sn_school','vig_school','pd3-school','pd4-school'];
function getInstitutionName() {
  return (typeof userProfile !== 'undefined' && userProfile && userProfile.institution) ? userProfile.institution : '';
}
function applyInstitutionEverywhere() {
  const name = getInstitutionName();
  INSTITUTION_FIELD_IDS.forEach(id => { const el = document.getElementById(id); if (el) el.value = name; });
}

function buildLevelOptions(n) {
  // إذا وُجدت لائحة تلاميذ مستوردة: الأقسام تأتي منها مباشرة
  const imported = getImportedClasses();
  if (imported.length) {
    const esc = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return '<option value="">— اختر القسم —</option><optgroup label="📥 أقسام لائحة التلاميذ">' +
      imported.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('') + '</optgroup>';
  }
  // لا توجد لائحة مستوردة: لا أقسام يدوية — تُؤخذ الأقسام من اللائحة فقط
  return '<option value="">— استورد لائحة التلاميذ لتظهر الأقسام —</option>';
  // (الأقسام اليدوية القديمة معطّلة)
  n = n || 16;
  const cycle = (userProfile && userProfile.cycle) ? userProfile.cycle : 'college';
  let opts = '<option value="">— اختر القسم —</option>';
  if (cycle === 'college' || cycle === 'both' || cycle === 'all') {
    opts += buildCollegeOptions(n);
  }
  if (cycle === 'lycee' || cycle === 'both' || cycle === 'all') {
    opts += buildLyceeOptions();
  }
  if (cycle === 'primary' || cycle === 'all') {
    opts += buildPrimaryOptions();
  }
  return opts;
}

function updateAllLevelSelects() {
  // تحديث جميع قوائم الأقسام في الصفحة (كل ما يحمل class="level-select")
  document.querySelectorAll('select.level-select:not(.abm-select):not([data-react-level])').forEach(el => {
    const currentVal = el.value;
    el.innerHTML = buildLevelOptions(16);
    if (currentVal) {
      const opt = el.querySelector(`option[value="${currentVal}"]`);
      if (opt) el.value = currentVal;
    }
  });
}
