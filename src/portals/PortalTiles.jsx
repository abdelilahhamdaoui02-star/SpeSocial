import { Fragment } from 'react';
import { PORTALS } from './portals.js';
import { openPortal } from '../navigation.js';
import { usePortalLabel, useCurrentPortal } from '../store/hooks.js';

function Tile({ portal }) {
  // التسمية المخصّصة من لوحة الأدمين (إن وُجدت) وإلا الافتراضية
  const custom = usePortalLabel(portal.id);
  const lines = custom ? [custom] : portal.label;
  // البوابة المفتوحة تُعلَّم في عمود البوابات (يظهر بجانب المحتوى في الحاسوب)
  const on = useCurrentPortal() === portal.id;
  return (
    <button type="button" className={`hp-tile ${portal.color}${on ? ' on' : ''}`} aria-current={on ? 'page' : undefined} onClick={() => openPortal(portal.id)}>
      <span className="hp-ico" dangerouslySetInnerHTML={{ __html: portal.icon }} />
      <span className="hp-lbl">
        {lines.map((line, i) => (
          <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>
        ))}
      </span>
      <svg className="hp-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5l-7 7 7 7" /></svg>
    </button>
  );
}

// بلا group: كل البوابات بالترتيب المعتمد في portals.js
export default function PortalTiles({ group }) {
  return PORTALS.filter((p) => !group || p.group === group).map((p) => <Tile key={p.id} portal={p} />);
}
