// هيكل الصفحة (الترويسة والبوابة الرئيسية وصفحات الأدوات وتذييل المطوّر) — كان src/legacy/body.html ويُحقَن بـ dangerouslySetInnerHTML (الخطوة 48).
// المعرّفات والأصناف كما كانت حرفياً لأن الأنماط (styles.js) وبقية الوحدات تعتمد عليها؛ والأقسام الديناميكية فراغات تُرسم فيها مكوّنات React عبر createPortal من LegacyApp.
// الهيكل ثابت: memo بلا خصائص فلا يُعاد رسمه أبداً، فتبقى تعديلات DOM التي تجريها وحدات الجلسة والتنقل (صنف open وdisplay وأسماء المستخدم) كما هي.
import { memo } from 'react';
import { goHome } from '../navigation.js';
import { toolDomId } from '../nav/navLogic.js';
import { useCurrentPortal, useEntered } from '../store/hooks.js';
import FrozenNav from '../nav/FrozenNav.jsx';
import { openProfile } from '../profile/profileWindow.js';

const goBack = () => goHome();

// صفحات الأدوات: شريط عودة بعنوان وشريحة المستخدم، ثم حاوية رئيسية فيها نقطة الرسم mount
// barStyle: لون الشريط؛ avatarId/nameId: معرّفا شريحة المستخدم (إن وُجدا)؛ noUserTitle: بلا tooltip «الحساب الشخصي»؛
// nested: نقطة الرسم div داخل .main-container؛ hero/heroStyle/mountStyle: صفحة الإحالة (شريط عنوان وحاوية بأنماط خاصة)
const TOOLS = [
  { id: "toolPrintdocs", title: "🏥 بوابة الإحالة والإخبار الصحي", avatarId: "bbAvatarPrint", nameId: "bbNamePrint", mount: "mountPrintdocs", hero: "mountPrintdocsHero", heroStyle: { background: "linear-gradient(135deg,#0a1f3d 0%,#1a3a5c 55%,#1e4976 100%)", padding: "20px 20px 0", position: "relative", overflow: "hidden" }, mountStyle: { paddingTop: "14px" } },
  { id: "toolInterview", title: "🗂 نموذج تقرير المقابلة الفردية", avatarId: "bbAvatar", nameId: "bbName", mount: "mountInterview" },
  { id: "toolReintegration", title: "📋 نموذج تتبع إعادة الإدماج المدرسي", avatarId: "bbAvatar", nameId: "bbName", mount: "mountReintegration" },
  { id: "toolIip", title: "🧩 البرنامج التدخلي الفردي — المختص الاجتماعي", barStyle: { background: "linear-gradient(90deg,#0f5e63,#14909a)" }, mount: "mountIip", nested: true },
  { id: "toolAbsence", title: "🚨 نموذج تتبع التلاميذ الأكثر غياباً", barStyle: { background: "linear-gradient(90deg,#92400e,#d97706)" }, mount: "mountAbsence" },
  { id: "toolParents", title: "📞 التواصل مع أولياء الأمور", noUserTitle: true, mount: "mountParents", nested: true },
  { id: "toolFollowup", title: "🔔 المتابعة وتتبع الحالات", noUserTitle: true, mount: "mountFollowup", nested: true },
  { id: "toolTasklog", title: "📝 سجل المهام اليومي للمختص الاجتماعي", avatarId: "bbAvatar", nameId: "bbName", mount: "mountTasklog", nested: true },
  { id: "toolStats", title: "📊 الإحصاء البياني لعمل المختص الاجتماعي", avatarId: "bbAvatar", nameId: "bbName", mount: "mountStatsPage" },
  { id: "toolViolence", title: "🛡️ نموذج التدخل في حالات العنف", barStyle: { background: "linear-gradient(90deg,#991b1b,#dc2626)" }, mount: "mountViolence" },
  { id: "toolCasefile", title: "📁 ملف الحالة الشامل", barStyle: { background: "linear-gradient(90deg,#0f766e,#0d9488)" }, mount: "mountCasefile" },
  { id: "toolWorkshops", title: "🎯 الورشات والأنشطة التربوية", barStyle: { background: "linear-gradient(90deg,#92400e,#d97706)" }, avatarId: "bbAvatarWorkshops", nameId: "bbNameWorkshops", mount: "mountWorkshops" },
  { id: "toolSpecialNeeds", title: "♿ وضعية إعاقة وصعوبات التعلم", barStyle: { background: "linear-gradient(90deg,#1d4ed8,#2563eb)" }, avatarId: "bbAvatarSN", nameId: "bbNameSN", mount: "mountSpecialNeeds" },
  { id: "toolVigilance", title: "خلية اليقظة — التلاميذ في وضعية حرجة", avatarId: "bbAvatar", nameId: "bbName", mount: "mountVigilance" },
  { id: "toolBehavior", title: "رصد السلوك — الجدول الأسبوعي للسلوكات", avatarId: "bbAvatar", nameId: "bbName", mount: "mountBehavior", nested: true },
];

// صفحة البوابة ظاهرة (فئة active) حين تكون هي البوابة المفتوحة؛ كانت navigation.js تبدّل الفئة بـclassList
function ToolPage({ t }) {
  const active = toolDomId(useCurrentPortal()) === t.id;
  return (
    <div id={t.id} className={active ? 'tool-page active' : 'tool-page'}>
      <div className="back-bar" style={t.barStyle}>
        <div className="back-bar-right">
          <button className="back-btn" onClick={goBack}>← العودة للرئيسية</button>
          <span className="back-bar-title">{t.title}</span>
        </div>
        <div className="back-bar-user" onClick={openProfile} title={t.noUserTitle ? undefined : 'الحساب الشخصي'}>
          <div className="bb-avatar" id={t.avatarId}>؟</div>
          <span className="bb-name" id={t.nameId}>الحساب</span>
        </div>
      </div>
      {t.hero ? (
        <>
          <div id={t.hero} style={t.heroStyle}></div>
          <div className="main-container" id={t.mount} style={t.mountStyle}></div>
        </>
      ) : t.nested ? (
        <div className="main-container"><div id={t.mount}></div></div>
      ) : (
        <div className="main-container" id={t.mount}></div>
      )}
    </div>
  );
}

// الصفحة الرئيسية: تظهر بعد الدخول وما دامت لا توجد بوابة مفتوحة (كانت تُبدَّل بـstyle.display من navigation وsessionFlow)
function PortalLanding({ children }) {
  const current = useCurrentPortal();
  const entered = useEntered();
  return <div id="portalLanding" style={{ display: entered && !current ? 'block' : 'none' }}>{children}</div>;
}

function AppShell() {
  return (
    <>
      <div className="page-wrapper">
        <div id="firebaseSetupModal"></div>
        <div id="profileModal"></div>
        <div id="settingsModal"></div>
        <FrozenNav />
        <header className="site-header">
          <div className="header-top">
            <div className="header-brand">
              <div className="header-emblem">🎓</div>
              <div className="header-text">
                <h1>المملكة المغربية</h1>
                <p className="dyn-ministry">وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
                <p className="dynamic-directorate">مديرية الحي الحسني</p>
              </div>
            </div>
            <div className="hdr-title" style={{ textAlign: "center", flex: "1", padding: "0 16px" }}>
              <h2 style={{ fontFamily: "'Amiri',serif", fontSize: "1.45rem", fontWeight: "700", color: "white", margin: "0" }}>🗂 أدوات التوثيق</h2>
            </div>
            <div id="userBar"></div>
          </div>
          <div id="searchNotifBar" style={{ display: "none", alignItems: "center", gap: "10px", padding: "8px 20px 10px", background: "rgba(0,0,0,0.15)" }}>
            <div id="globalSearchBar" style={{ flex: "1", position: "relative" }}></div>
            <div id="mountNotifBell"></div>
          </div>
          <div className="home-hero">
            <div className="hp-min">
              <img id="hpMinistryLogo" alt="شعار الوزارة" src="" />
              {" "}
              <b>المملكة المغربية</b>
              {" "}
              <span className="dyn-ministry">وزارة التربية الوطنية والتعليم الأولي والرياضة</span>
            </div>
            <div className="hp-center">
              <div className="hp-center-txt">
                <h2 className="hp-school dynamic-directorate">مديرية الحي الحسني</h2>
                <p className="hp-sub">منصة التوثيق المهني</p>
                <div className="hp-count">
                  <svg className="" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="9" cy="8" r="3.5"></circle>
                    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"></path>
                    <circle cx="17.5" cy="9" r="2.5"></circle>
                    <path d="M17 14c2.8 0 4.7 1.9 4.7 5"></path>
                  </svg>
                  <span id="mountStudentCount"></span>
                </div>
              </div>
              <svg className="hp-bld" viewBox="0 0 140 124" aria-hidden="true">
                <line x1="70" y1="3" x2="70" y2="24" stroke="#d5deef" strokeWidth="2"></line>
                <path d="M70 4h16l-4 4.5 4 4.5H70z" fill="#e5352b"></path>
                <polygon points="48,28 70,14 92,28" fill="#c62d2d"></polygon>
                <rect x="52" y="28" width="36" height="28" fill="#f4f7fd"></rect>
                <rect x="60" y="34" width="8" height="10" rx="2" fill="#2f6fe4"></rect>
                <rect x="72" y="34" width="8" height="10" rx="2" fill="#2f6fe4"></rect>
                <rect x="9" y="50" width="122" height="7" rx="2" fill="#c62d2d"></rect>
                <rect x="14" y="57" width="112" height="49" fill="#f8faff"></rect>
                <g fill="#2f6fe4">
                  <rect x="21" y="64" width="11" height="11" rx="2"></rect>
                  <rect x="38" y="64" width="11" height="11" rx="2"></rect>
                  <rect x="91" y="64" width="11" height="11" rx="2"></rect>
                  <rect x="108" y="64" width="11" height="11" rx="2"></rect>
                  <rect x="21" y="83" width="11" height="11" rx="2"></rect>
                  <rect x="38" y="83" width="11" height="11" rx="2"></rect>
                  <rect x="91" y="83" width="11" height="11" rx="2"></rect>
                  <rect x="108" y="83" width="11" height="11" rx="2"></rect>
                </g>
                <path d="M60 106V86a10 10 0 0 1 20 0v20z" fill="#1f4fb8"></path>
                <rect x="5" y="106" width="130" height="6" rx="3" fill="#cfd8ea"></rect>
              </svg>
            </div>
            <div className="hp-date" id="portalDateBox">
              <div id="mountHeroDate"></div>
              <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="9" width="36" height="33" rx="6" fill="rgba(255,255,255,.14)"></rect>
                <path d="M15 5v8M33 5v8M6 19h36"></path>
                <g fill="#fff" stroke="none">
                  <rect x="13" y="25" width="5" height="4" rx="1"></rect>
                  <rect x="21.5" y="25" width="5" height="4" rx="1"></rect>
                  <rect x="30" y="25" width="5" height="4" rx="1"></rect>
                  <rect x="13" y="32" width="5" height="4" rx="1"></rect>
                  <rect x="21.5" y="32" width="5" height="4" rx="1"></rect>
                  <rect x="30" y="32" width="5" height="4" rx="1"></rect>
                </g>
              </svg>
            </div>
          </div>
          <div className="accent-bar"></div>
        </header>
        <PortalLanding>
          <div id="mountSiteNotice"></div>
          <div className="hp-main">
            <section className="hp-panel hp-others" aria-label="بوابات أخرى">
              <h3 className="hp-panel-title">
                <svg className="" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="7.5" height="7.5" rx="2"></rect>
                  <rect x="13.5" y="3" width="7.5" height="7.5" rx="2"></rect>
                  <rect x="3" y="13.5" width="7.5" height="7.5" rx="2"></rect>
                  <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"></rect>
                </svg>
                <span>بوابات أخرى</span>
              </h3>
              <div className="hp-list" id="mountTilesOthers"></div>
            </section>
            <section className="hp-panel hp-stats" aria-label="إحصائيات">
              <div className="hp-stats-head" id="mountStatsHead"></div>
              <div className="hp-inner" id="mountStatsKpis"></div>
              <div className="hp-inner hp-chart-card" id="mountStatsChart"></div>
              <div className="hp-inner hp-news-card" id="mountNews"></div>
            </section>
            <section className="hp-panel hp-portals" aria-label="البوابات">
              <h3 className="hp-panel-title">
                <svg className="" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="9" cy="8" r="3.5"></circle>
                  <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"></path>
                  <circle cx="17.5" cy="9" r="2.5"></circle>
                  <path d="M17 14c2.8 0 4.7 1.9 4.7 5"></path>
                </svg>
                <span>البوابات</span>
              </h3>
              <div className="hp-list" id="mountTilesPortals"></div>
            </section>
          </div>
          <div className="hp-report" id="mountHomeReport"></div>
        </PortalLanding>
        {TOOLS.map((t) => <ToolPage key={t.id} t={t} />)}
      </div>
      <div className="dev-footer" style={{ background: "linear-gradient(135deg,#0f2744,#1a3a5c)", color: "rgba(255,255,255,0.6)", textAlign: "center", padding: "12px 20px", fontSize: "0.74rem", direction: "rtl", borderTop: "2px solid rgba(200,169,74,0.3)" }}>
        <span style={{ color: "rgba(200,169,74,0.9)" }}>{" تم البرمجة والتطوير بواسطة:"}</span>
        {" "}
        <strong style={{ color: "#f0d97a", fontSize: "0.82rem", margin: "0 6px" }}>عبدالإله حمداوي</strong>
        {" "}
        <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
        {" "}
        <span style={{ color: "rgba(255,255,255,0.55)", marginRight: "6px" }}>جميع الحقوق محفوظة © 2026</span>
        {" "}
        <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
        {" "}
        <span style={{ color: "rgba(200,169,74,0.7)", marginRight: "6px" }}>الإصدار v14 — 2026</span>
      </div>
    </>
  );
}

export default memo(AppShell);
