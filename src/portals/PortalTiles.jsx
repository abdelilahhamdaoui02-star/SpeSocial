import { Fragment } from 'react';
import { PORTALS } from './portals.js';
import { openPortal } from '../navigation.js';
import { useCollection, usePortalLabel } from '../store/hooks.js';
import { followCount } from '../gates/gateLogic.js';

// شارة المتابعة: عدد سجلات المتابعة غير المعالَجة، تُحسب من المخزن فتتحدّث وحدها
// (كانت updateFollowBadge القديمة تكتب فيها مباشرة عند الدخول وبعد حفظ/حذف سجل متابعة فقط)
function FollowBadge() {
  const [rows] = useCollection('followUp');
  const n = followCount(rows);
  return <span id="fuBadge" className="fu-badge" style={{ display: n ? 'inline-flex' : 'none' }}>{n}</span>;
}

function Tile({ portal }) {
  // التسمية المخصّصة من لوحة الأدمين (إن وُجدت) وإلا الافتراضية
  const custom = usePortalLabel(portal.id);
  const lines = custom ? [custom] : portal.label;
  return (
    <button type="button" className={`hp-tile ${portal.color}`} onClick={() => openPortal(portal.id)}>
      <span className="hp-ico" dangerouslySetInnerHTML={{ __html: portal.icon }} />
      <span className="hp-lbl">
        {lines.map((line, i) => (
          <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>
        ))}
      </span>
      {portal.id === 'followup' && <FollowBadge />}
      <svg className="hp-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5l-7 7 7 7" /></svg>
    </button>
  );
}

export default function PortalTiles({ group }) {
  return PORTALS.filter((p) => p.group === group).map((p) => <Tile key={p.id} portal={p} />);
}
