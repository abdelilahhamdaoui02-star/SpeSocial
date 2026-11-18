import { Fragment, useEffect, useState } from 'react';
import { PORTALS, DESK_GROUPS, DESK_COLOR } from './portals.js';
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

const groupOf = (id) => DESK_GROUPS.find((g) => g.items?.includes(id))?.id || null;
const isSingle = (id) => DESK_GROUPS.some((g) => g.single === id);

// بوابة مستقلة في العمود (مثل ملف الحالة الشامل): بطاقة واحدة بلا طيّ
function SingleHead({ g, portal }) {
  const custom = usePortalLabel(portal.id);
  const on = useCurrentPortal() === portal.id;
  return (
    <div className={`dg dg-single ${g.color}${on ? ' has-on' : ''}`}>
      <button type="button" className="dg-head" aria-current={on ? 'page' : undefined} onClick={() => openPortal(portal.id)}>
        <span className="dg-ico" dangerouslySetInnerHTML={{ __html: portal.icon }} />
        <span className="dg-title">{custom || portal.label.join(' ')}</span>
        <svg className="dg-chev dg-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5l-7 7 7 7" /></svg>
      </button>
    </div>
  );
}

// عمود الحاسوب: مجموعات (أكورديون) + بوابات مستقلة. المجموعة التي فيها البوابة المفتوحة تُفتح تلقائياً.
function DeskGroups() {
  const current = useCurrentPortal();
  const [open, setOpen] = useState(() => groupOf(current) || DESK_GROUPS.find((g) => g.items)?.id);
  useEffect(() => {
    const g = groupOf(current);
    if (g) setOpen(g);
    else if (isSingle(current)) setOpen(null);
  }, [current]);
  const by = Object.fromEntries(PORTALS.map((p) => [p.id, p]));
  return DESK_GROUPS.map((g) => {
    if (g.single) return by[g.single] ? <SingleHead key={g.id} g={g} portal={by[g.single]} /> : null;
    const isOpen = open === g.id;
    return (
      <div key={g.id} className={`dg ${g.color}${isOpen ? ' open' : ''}${g.items.includes(current) ? ' has-on' : ''}`}>
        <button type="button" className="dg-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : g.id)}>
          <span className="dg-ico" dangerouslySetInnerHTML={{ __html: g.icon }} />
          <span className="dg-title">{g.title}</span>
          <span className="dg-count">{g.items.length}</span>
          <svg className="dg-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        {isOpen && (
          <div className="dg-body">
            {g.items.filter((id) => by[id]).map((id) => <Tile key={id} portal={by[id]} color={DESK_COLOR[id]} />)}
          </div>
        )}
      </div>
    );
  });
}

// group: بوابات الرئيسية في الهاتف والتابلت كما كانت؛ desk: عمود الحاسوب الثابت بمجموعاته الأربع
export default function PortalTiles({ group, desk }) {
  if (desk) return <DeskGroups />;
  return PORTALS.filter((p) => p.group === group).map((p) => <Tile key={p.id} portal={p} />);
}
