// منطق «البحث العام عن تلميذ» — دوال بحتة بلا DOM، منقولة من globalSearchStudents في script-10.js.

export const MIN_QUERY = 2;
export const MAX_STUDENT_RESULTS = 8;
export const MAX_ARCHIVE_RESULTS = 5;

// توحيد الألف والتاء المربوطة والياء، وحروف صغيرة (كما في البحث القديم)
export const normSearch = (v) => (v || '').replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه').replace(/[يى]/g, 'ي').toLowerCase();

// مصادر الأرشيف التي يُبحث فيها عن الاسم، بترتيبها القديم
export const ARCHIVE_SOURCES = Object.freeze([
  { key: 'interviewArchive',     type: 'مقابلة', icon: '🗂', color: '#1a3a5c' },
  { key: 'reintegrationArchive', type: 'إدماج',  icon: '📋', color: '#16a34a' },
  { key: 'absenceArchive',       type: 'غياب',   icon: '🚨', color: '#d97706' },
  { key: 'violenceArchive',      type: 'عنف',    icon: '🛡️', color: '#dc2626' },
]);

// قاعدة التلاميذ + المخصَّصين الذين ليسوا فيها (المقارنة بالاسم بعد التوحيد)
export function mergeStudents(dbList, customList) {
  const custom = (customList || []).map((s) => ({
    fullName: s.name || s.fullName || '', class: s.class || '', gender: s.gender || '', massar: s.massar || '', _fromCustom: true,
  }));
  const all = [...(dbList || [])];
  custom.forEach((c) => {
    if (c.fullName && !all.find((s) => normSearch(s.fullName) === normSearch(c.fullName))) all.push(c);
  });
  return all;
}

export function searchStudents(all, query, limit = MAX_STUDENT_RESULTS) {
  const q = (query || '').trim();
  return all.filter((s) => normSearch(s.fullName).includes(normSearch(q)) || (s.massar || '').toLowerCase().startsWith(q.toLowerCase())).slice(0, limit);
}

// نتائج الأرشيف: اسم واحد لكل تلميذ (أول ظهور)، ثم أول 5
export function searchArchives(collections, query, limit = MAX_ARCHIVE_RESULTS) {
  const q = (query || '').trim();
  const seen = new Set();
  const out = [];
  ARCHIVE_SOURCES.forEach((src) => {
    ((collections && collections[src.key]) || []).forEach((e) => {
      const name = e.studentName;
      if (normSearch(name).includes(normSearch(q)) && !seen.has(name)) {
        seen.add(name);
        out.push({ name, school: e.school, type: src.type, icon: src.icon, color: src.color });
      }
    });
  });
  return out.slice(0, limit);
}

// null إن كان النص أقصر من حرفين (القائمة مغلقة)، وإلا { students, archive }
export function globalSearch({ students, customStudents, collections, query }) {
  const q = (query || '').trim();
  if (q.length < MIN_QUERY) return null;
  return {
    students: searchStudents(mergeStudents(students, customStudents), q),
    archive: searchArchives(collections, q),
  };
}
