import { FROZEN_NAV, frozenLabel, portalTitle } from './navLogic.js';
import { openPortal } from '../navigation.js';
import { useCurrentPortal, usePortalLabel } from '../store/hooks.js';

// بطاقة واحدة: الاسم المخصّص من لوحة الأدمين يصل من المخزن فتتحدّث وحدها
// (كان applySiteConfig القديم يعيد بناء الشريط يدوياً عند كل تغيير)
function Card({ item, active }) {
  const custom = usePortalLabel(item.key);
  return (
    <div
      className={`frozen-card${active ? ' active-tool' : ''}`}
      data-tool={item.key}
      title={portalTitle(item.key, custom)}
      onClick={() => openPortal(item.key)}
    >
      <div className="frozen-card-icon">{item.icon}</div>
      <div className="frozen-card-label">{frozenLabel(item, custom)}</div>
    </div>
  );
}

// الشريط المجمَّد على يمين الصفحة أثناء فتح بوابة: ظاهر (فئة visible) ما دامت هناك بوابة مفتوحة.
// المعرّف #frozenNav باقٍ لأن الأنماط تعتمد عليه.
export default function FrozenNav() {
  const current = useCurrentPortal();
  return (
    <div id="frozenNav" className={current ? 'visible' : undefined}>
      {FROZEN_NAV.map((item) => <Card key={item.key} item={item} active={item.key === current} />)}
    </div>
  );
}
