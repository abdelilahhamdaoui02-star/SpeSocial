import { Fragment } from 'react';
import { PORTALS, DESK_ORDER, DESK_COLOR } from './portals.js';
import { openPortal } from '../navigation.js';
import { usePortalLabel, useCurrentPortal } from '../store/hooks.js';

function Tile({ portal, color }) {
  // التسمية المخصّصة من لوحة الأدمين (إن وُجدت) وإلا الافتراضية
  const custom = usePortalLabel(portal.id);
  const lines = custom ? [custom] : portal.label;
  // البوابة المفتوحة تُعلَّم في عمود البوابات (يظهر بجانب المحتوى في الحاسوب)
  const on = useCurrentPortal() === portal.id;
  return (
    <button type="button" className={`hp-tile ${color || portal.color}${on ? ' on' : ''}`} aria-current={on ? 'page' : undefined} onClick={() => openPortal(portal.id)}>
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

// group: بوابات الرئيسية في الهاتف والتابلت كما كانت؛ desk: عمود الحاسوب الثابت بكل البوابات بالترتيب المخصّص
export default function PortalTiles({ group, desk }) {
  if (desk) {
    const by = Object.fromEntries(PORTALS.map((p) => [p.id, p]));
    return DESK_ORDER.filter((id) => by[id]).map((id) => <Tile key={id} portal={by[id]} color={DESK_COLOR[id]} />);
  }
  return PORTALS.filter((p) => p.group === group).map((p) => <Tile key={p.id} portal={p} />);
}
