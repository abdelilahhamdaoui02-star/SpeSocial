import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './styles.js';
import '../students/studentDb.js'; // يسجّل window.StudentDb وwindow.STUDENT_DB
import '../students/studentList.js'; // يسجّل window.StudentList وwindow.printStudentList
import '../students/cleanClass.js'; // يسجّل window.cleanClassValue للكود القديم
import '../export/wordExport.js'; // يسجّل window.exportToWord للكود القديم
import '../weekly/weeklyReport.js'; // يسجّل window.WeeklyReport (جمع صفوف التقرير الأسبوعي وبناء HTML) للكود القديم
import '../weekly/weeklyPrint.js'; // يسجّل window.WeeklyPrint (طباعة التقرير الأسبوعي وحفظه PDF وتصديره إلى Word) للكود القديم
import '../autocomplete/studentAutocomplete.js'; // يسجّل window.acSetup/acFillField/acSelect/initAllAutocomplete
import AppShell from './AppShell.jsx';
import { loadExternalLibs } from '../libs/externalLibs.js';
import PortalTiles from '../portals/PortalTiles.jsx';
import HomeStats from '../home/HomeStats.jsx';
import WeeklyReportCard from '../home/WeeklyReportCard.jsx';
import HeaderBits from '../header/HeaderBits.jsx';
import NewsCard from '../news/NewsCard.jsx';
import CasefilePortal from '../casefile/CasefilePortal.jsx';
import { ParentsPortal, FollowupPortal } from '../gates/GatePortals.jsx';
import TasklogPortal from '../tasklog/TasklogPortal.jsx';
import StatsPortal from '../stats/StatsPortal.jsx';
import IipPortal from '../iip/IipPortal.jsx';
import BehaviorPortal from '../behavior/BehaviorPortal.jsx';
import ViolencePortal from '../violence/ViolencePortal.jsx';
import ReintegrationPortal from '../reintegration/ReintegrationPortal.jsx';
import AbsencePortal from '../absence/AbsencePortal.jsx';
import WorkshopsPortal from '../workshops/WorkshopsPortal.jsx';
import InterviewPortal from '../interview/InterviewPortal.jsx';
import PrintdocsPortal from '../printdocs/PrintdocsPortal.jsx';
import VigilancePortal from '../vigilance/VigilancePortal.jsx';
import SpecialNeedsPortal from '../specialneeds/SpecialNeedsPortal.jsx';
import PreviewHost from '../preview/PreviewHost.jsx';
import ProfileModal from '../profile/ProfileModal.jsx';
import SettingsModal from '../settings/SettingsModal.jsx';
import GlobalSearch from '../search/GlobalSearch.jsx';
import StudentHistoryModal from '../history/StudentHistoryModal.jsx';
import ToastHost from '../ui/ToastHost.jsx';
import { installNavigation } from '../navigation.js';
import { installLogo } from '../settings/logoStore.js';
import FirebaseSetupModal from '../firebase-setup/FirebaseSetupModal.jsx';
import SiteNotice from '../notice/SiteNotice.jsx';
import WeekPickerModal from '../weekpicker/WeekPickerModal.jsx';
import { installWeekPicker } from '../weekpicker/weekPickerStore.js';
import WeeklyPreviewModal from '../weeklypreview/WeeklyPreviewModal.jsx';
import { installWeeklyPreview } from '../weeklypreview/weeklyPreviewStore.js';
import BootScreens from '../boot/BootScreens.jsx';
import { startBoot } from '../boot/bootStore.js';
import { installProfileWindow } from '../profile/profileWindow.js';
import { installHomeChrome, useOnHomeClass } from '../home/homeChrome.js';
import { DEFAULT_MINISTRY_LOGO_B64 } from '../settings/defaultLogo.js';
import TrackingModals, { NotifBell } from '../tracking/TrackingModals.jsx';
import { installPrintHelpers } from '../print/printHelpers.js';
import { installSession, afterLegacyReady } from '../session/installSession.js';

// الخطوة 47: التخزين والدخول والخروج وأرشيفات الأقسام والتقرير الأسبوعي (كانت في script-10/15/16.js) وwindow.__legacyBridge؛ تُركَّب أولاً لأن بقية install* تقرأ الجسر
installSession();
installNavigation(); // التنقل صار حالة React (nav/navStore) تتبع حدثي الدخول والخروج؛ لم يبقَ openTool/goBack على window
// الشعار الافتراضي ودوال تطبيقه صارت هنا (كانت في script-00.js وscript-10.js)؛ يُقرأ بـgetLogo() لا من window
installLogo();
// نافذة اختيار الأسبوع صارت هنا؛ openWeekPickerModal وcloseWeekPickerModal تُسجَّلان قبل تحميل السكربتات (بلاطة سجل المهام وHTML القديم يستدعيانهما)
installWeekPicker();
// نافذة معاينة وتعديل التقرير الأسبوعي صارت هنا؛ openWeeklyReportPreview وwprClose تُسجَّلان قبل تحميل السكربتات (نافذة اختيار الأسبوع وبطاقة التقرير تستدعيها)
installWeeklyPreview();
// openProfile وcloseProfile (مع تغليف الهاتف الذي كان في script-39.js) صارتا في profileWindow وتُستوردان مباشرة؛ هنا يُركَّب زر الرجوع في الهاتف فقط
installProfileWindow();
// مساعدات الطباعة (الجدول المضغوط وانتظار الشعار ووضع الطباعة) صارت هنا (كانت في script-37.js وجزء من script-16.js وscript-10.js)؛ تُركَّب قبل تحميل السكربتات
installPrintHelpers();

let started = false; // يمنع التشغيل المزدوج في StrictMode

export default function LegacyApp() {
  const ref = useRef(null);
  // نقاط الإدراج داخل HTML القديم: بلاطات البوابات صارت مكوّنات React تُرسم هنا
  const [mounts, setMounts] = useState(null);

  useLayoutEffect(() => {
    setMounts({
      others: document.getElementById('mountTilesOthers'),
      portals: document.getElementById('mountTilesPortals'),
      statsHead: document.getElementById('mountStatsHead'),
      statsKpis: document.getElementById('mountStatsKpis'),
      statsChart: document.getElementById('mountStatsChart'),
      report: document.getElementById('mountHomeReport'),
      heroDate: document.getElementById('mountHeroDate'),
      studentCount: document.getElementById('mountStudentCount'),
      userBar: document.getElementById('userBar'),
      news: document.getElementById('mountNews'),
      casefile: document.getElementById('mountCasefile'),
      parents: document.getElementById('mountParents'),
      followup: document.getElementById('mountFollowup'),
      tasklog: document.getElementById('mountTasklog'),
      statsPage: document.getElementById('mountStatsPage'),
      iip: document.getElementById('mountIip'),
      behavior: document.getElementById('mountBehavior'),
      violence: document.getElementById('mountViolence'),
      reintegration: document.getElementById('mountReintegration'),
      absence: document.getElementById('mountAbsence'),
      workshops: document.getElementById('mountWorkshops'),
      interview: document.getElementById('mountInterview'),
      printdocsHero: document.getElementById('mountPrintdocsHero'),
      printdocs: document.getElementById('mountPrintdocs'),
      vigilance: document.getElementById('mountVigilance'),
      specialneeds: document.getElementById('mountSpecialNeeds'),
      profile: document.getElementById('profileModal'),
      settings: document.getElementById('settingsModal'),
      globalSearch: document.getElementById('globalSearchBar'),
      notifBell: document.getElementById('mountNotifBell'),
      firebaseSetup: document.getElementById('firebaseSetupModal'),
      siteNotice: document.getElementById('mountSiteNotice'),
    });
  }, []);

  useEffect(() => {
    if (started) return;
    started = true;
    (async () => {
      // المكتبات الخارجية (docx وChart.js وXLSX وExcelJS) من npm بدل CDN (الخطوة 48)
      await loadExternalLibs();
      // مستمعو DOMContentLoaded وload (الشعار وغيره) ينتظرون؛ نُطلقهما يدوياً بعد التحميل
      document.dispatchEvent(new Event('DOMContentLoaded'));
      window.dispatchEvent(new Event('load'));
      afterLegacyReady(); // شارة الأسبوع والشعار وحالة Firebase (كانت مستمعي DOMContentLoaded/load في script-10.js)
      // الإقلاع (فحص الإنترنت ثم Firebase ثم الدخول التلقائي) صار هنا بدل script-11.js؛ يبدأ بعد DOMContentLoaded كما كان
      startBoot();
    })();
  }, []);

  // فئة on-home وشعار الصفحة الرئيسية (كانا في script-23.js)؛ body.html موجود في الصفحة عند أول رسم
  useEffect(() => installHomeChrome({ doc: document, defaultLogo: DEFAULT_MINISTRY_LOGO_B64 }), []);
  useOnHomeClass();

  return (
    <>
      <div ref={ref}><AppShell /></div>
      {mounts?.others && createPortal(<PortalTiles group="others" />, mounts.others)}
      {mounts?.portals && createPortal(<PortalTiles group="portals" />, mounts.portals)}
      {/* المرحلة 7: الصفحة الرئيسية — بطاقات الإحصائيات والمخطط الشهري وبطاقة التقرير الأسبوعي */}
      {mounts && (
        <HomeStats mounts={{ head: mounts.statsHead, kpis: mounts.statsKpis, chart: mounts.statsChart }} />
      )}
      {mounts && <WeeklyReportCard mount={mounts.report} />}
      {/* المرحلة 8: تاريخ اللوحة وعدد التلاميذ وشريط المستخدم */}
      {mounts && <HeaderBits mounts={{ date: mounts.heroDate, count: mounts.studentCount, userBar: mounts.userBar }} />}
      {/* المرحلة 9: بطاقة أخبار وقوانين المختصين */}
      {mounts && <NewsCard mount={mounts.news} />}
      {/* المرحلة 10: بوابة ملف الحالة الشامل */}
      {mounts && <CasefilePortal mount={mounts.casefile} />}
      {/* المرحلة 11: بوابتا التواصل مع الأولياء والمتابعة */}
      {mounts && <ParentsPortal mount={mounts.parents} />}
      {mounts && <FollowupPortal mount={mounts.followup} />}
      {/* المرحلة 12: سجل المهام اليومي */}
      {mounts && <TasklogPortal mount={mounts.tasklog} />}
      {/* المرحلة 16: بوابة الإحصاء البياني */}
      {mounts && <StatsPortal mount={mounts.statsPage} />}
      {/* المرحلة 17: البرنامج التدخلي الفردي */}
      {mounts && <IipPortal mount={mounts.iip} />}
      {/* المرحلة 18: رصد السلوك */}
      {mounts && <BehaviorPortal mount={mounts.behavior} />}
      {/* المرحلة 19: حالات العنف */}
      {mounts && <ViolencePortal mount={mounts.violence} />}
      {/* المرحلة 20: الإدماج المدرسي */}
      {mounts && <ReintegrationPortal mount={mounts.reintegration} />}
      {/* المرحلة 21: التلاميذ الأكثر غياباً */}
      {mounts && <AbsencePortal mount={mounts.absence} />}
      {/* المرحلة 22: الورشات والأنشطة التربوية */}
      {mounts && <WorkshopsPortal mount={mounts.workshops} />}
      {/* المرحلة 23: المقابلات الفردية */}
      {mounts && <InterviewPortal mount={mounts.interview} />}
      {/* المرحلة 24: بوابة الإحالة والإخبار الصحي */}
      {mounts && <PrintdocsPortal hero={mounts.printdocsHero} mount={mounts.printdocs} />}
      {/* المرحلة 25: خلية اليقظة */}
      {mounts && <VigilancePortal mount={mounts.vigilance} />}
      {/* المرحلة 27: نافذة المعاينة الموحَّدة بدل نوافذ body.html العشر */}
      <PreviewHost />
      {/* المرحلة 26: وضعية إعاقة وصعوبات التعلم */}
      {mounts && <SpecialNeedsPortal mount={mounts.specialneeds} />}
      {/* المرحلة 13: نافذة الحساب الشخصي */}
      {mounts && <ProfileModal mount={mounts.profile} />}
      {/* المرحلة 14: نافذة الإعدادات (المظهر وFirebase) */}
      {mounts && <SettingsModal mount={mounts.settings} />}
      {/* المرحلة 32: التنقل والبحث العام وسجل التلميذ والإشعارات */}
      {mounts && <GlobalSearch mount={mounts.globalSearch} />}
      {/* الخطوة 45: جرس الإشعارات + نافذتا الإشعارات وجدول التتبع الشهري (تُرسمان في document.body عند الفتح) */}
      {mounts && <NotifBell mount={mounts.notifBell} />}
      <TrackingModals />
      {/* المرحلة 34: نافذة إعداد Firebase والميزاجور (إشعار التحديث) */}
      {mounts && <FirebaseSetupModal mount={mounts.firebaseSetup} />}
      {mounts && <SiteNotice mount={mounts.siteNotice} />}
      {/* الخطوة 35: نافذة اختيار الأسبوع (تُرسم في document.body عند الفتح) */}
      <WeekPickerModal />
      {/* الخطوة 40: نافذة معاينة وتعديل التقرير الأسبوعي ونافذة تعديل السجل (تُرسمان في document.body عند الفتح) */}
      <WeeklyPreviewModal />
      <StudentHistoryModal />
      <ToastHost />
      {/* الخطوة 42: شاشات الإقلاع (تحميل / لا اتصال / إعداد Firebase / فشل الاتصال) */}
      <BootScreens />
    </>
  );
}
