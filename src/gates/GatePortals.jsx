import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCurrentPortal } from '../store/hooks.js';
import { GATES } from './gateLogic.js';
import GateTable from './GateTable.jsx';
import { TrackingLinks } from '../tracking/TrackingModals.jsx';

// «التواصل مع الأولياء»: تبويبان (الاتصال الهاتفي / مقابلات الأولياء). المكوّنان يبقيان مركَّبين ويُخفى غير المحدد،
// فلا تضيع مسودة الاستمارة عند التبديل بين التبويبين (كالقديم الذي كان يخفي العنصرين بـ display فقط).
function ParentsBody() {
  const active = useCurrentPortal() === 'parents';
  const [tab, setTab] = useState(0);
  return (
    <>
      <div className="pg-tabs">
        <button type="button" className={tab === 0 ? 'on' : ''} onClick={() => setTab(0)}>📞 الاتصال الهاتفي</button>
        <button type="button" className={tab === 1 ? 'on' : ''} onClick={() => setTab(1)}>🤝 مقابلات الأولياء</button>
      </div>
      <GateTable gate={GATES.calls} active={active} hidden={tab !== 0} />
      <GateTable gate={GATES.meet} active={active} hidden={tab !== 1} />
    </>
  );
}

function FollowupBody() {
  const active = useCurrentPortal() === 'followup';
  return (
    <>
      <TrackingLinks />
      <GateTable gate={GATES.fu} active={active} />
    </>
  );
}

export function ParentsPortal({ mount }) {
  return mount ? createPortal(<ParentsBody />, mount) : null;
}

export function FollowupPortal({ mount }) {
  return mount ? createPortal(<FollowupBody />, mount) : null;
}
