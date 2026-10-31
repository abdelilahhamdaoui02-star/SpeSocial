// «إحالة للمتابعة»: يضيف تلميذاً من أرشيف المقابلات أو الغياب أو العنف إلى جدول «تتبع الحالات» (بوابة المتابعة)
import { getState, saveCollection } from '../store/legacyStore.js';
import { showToast } from '../ui/toast.js';
import { makeRecordId } from './gateLogic.js';

const clean = (v) => { const s = String(v == null ? '' : v).trim(); return s === '—' ? '' : s; };

const LABEL = { interview: 'مقابلة فردية', absence: 'ملف غياب', violence: 'حالة عنف' };
const detailOf = (e, src) => {
  if (src === 'interview') return clean(e.subject);
  if (src === 'absence') return e.unjustifiedHours && e.unjustifiedHours !== '—' ? 'غير مبررة: ' + e.unjustifiedHours + ' س' : '';
  if (src === 'violence') return (e.types || []).join(' / ');
  return '';
};

export async function referToFollowUp(entry, src) {
  const name = clean(entry && entry.studentName);
  if (!name) { showToast('⚠️ لا يوجد اسم تلميذ في هذا الملف'); return false; }
  const rows = getState().collections.followUp || [];
  if (rows.some((r) => r.src === src && String(r.srcId) === String(entry.id))) {
    showToast('ℹ️ هذا الملف محال إلى المتابعة من قبل');
    return false;
  }
  const detail = detailOf(entry, src);
  const row = {
    id: makeRecordId(), name, massar: clean(entry.massar), cls: clean(entry.level),
    status: 'قيد المتابعة', date: new Date().toISOString().slice(0, 10),
    note: 'محال من ' + LABEL[src] + (detail ? ' — ' + detail : ''),
    src, srcId: entry.id,
  };
  try {
    await saveCollection('followUp', [row, ...rows]);
    showToast('🔔 تمت الإحالة إلى بوابة المتابعة');
    return true;
  } catch (e) {
    console.error(e);
    showToast('❌ تعذّر حفظ الإحالة');
    return false;
  }
}
