// جسر التقرير الأسبوعي: قراءة الأرشيفات للنافذة والتقرير، وشارة الأسبوع في الرئيسية — منقولة من WPR_ARCHIVES/wprBridge/wk*/wp* في script-10.js (الخطوة 47).
//   deps: { appData, archives (من createArchives), WeeklyReport, WeeklyPrint, local, emit(name, detail?), updateDashboardStats(), getLogo() → شعار المؤسسة, now() → Date }
export function createWeeklyBridge(d) {
  const A = d.appData;
  const ar = d.archives;

  // نوع الأرشيف → قراءة/حفظ (تستعملها نافذة معاينة التقرير الأسبوعي)
  const ARCHIVES = {
    interview:     { get: () => ar.getArchive(),   save: (a) => ar.saveArchive(a) },
    reintegration: { get: () => ar.getRArchive(),  save: (a) => ar.saveRArchive(a) },
    absence:       { get: () => ar.getAbArchive(), save: (a) => ar.saveAbArchive(a) },
    violence:      { get: () => ar.getVioArchive(), save: (a) => ar.saveVioArchive(a) },
    workshop:      { get: () => A.workshopsArchive || [], save: (a) => { A.workshopsArchive = a; d.saveUserKey('workshopsArchive'); } },
    specNeeds:     { get: () => ar.getSnArchive(), save: (a) => ar.saveSnArchive(a) },
    parentCall:    { get: () => A.parentCalls || [],    save: (a) => { A.parentCalls = a; d.saveUserKey('parentCalls'); } },
    parentMeeting: { get: () => A.parentMeetings || [], save: (a) => { A.parentMeetings = a; d.saveUserKey('parentMeetings'); } },
  };

  function wkCollections() {
    return {
      interviewArchive: ar.getArchive(),
      reintegrationArchive: ar.getRArchive(),
      absenceArchive: ar.getAbArchive(),
      specialNeedsArchive: ar.getSnArchive(),
      violenceArchive: ar.getVioArchive(),
      workshopsArchive: A.workshopsArchive || [],
      // بوابة الاتصال بالأولياء: الهاتف والمقابلات
      parentCalls: A.parentCalls || [],
      parentMeetings: A.parentMeetings || [],
    };
  }

  const wprBridge = {
    collections: () => wkCollections(),
    get: (type) => (ARCHIVES[type] ? ARCHIVES[type].get() : []),
    save: (type, arr) => { if (ARCHIVES[type]) ARCHIVES[type].save(arr); },
    refreshStats: () => d.updateDashboardStats(),
  };

  const wkBuildRows = (from, to) => d.WeeklyReport.buildRows(wkCollections(), from, to);
  const wkReportHtml = (from, to) => d.WeeklyReport.buildReportHtml(wkBuildRows(from, to), from, to, d.getLogo());
  const downloadWeeklyReportWordForRange = async (from, to) => { await d.WeeklyPrint.exportWeeklyWord(wkReportHtml(from, to), from, to); };
  const printWeeklyReportForRange = (from, to) => { d.WeeklyPrint.printWeeklyReport(wkReportHtml(from, to)); };

  // الاثنين–الأحد للأسبوع المُزاح بعدد أسابيع (0 = الحالي)
  function wpGetWeekRange(offsetWeeks) {
    const now = d.now();
    const day = now.getDay();
    const diff = (day === 0) ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff + (offsetWeeks * 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) };
  }

  // شارة الأسبوع في بطاقة التقرير (مكوّن React) تستقبل الأسبوع المحدد عبر الحدث
  const wpUpdateMainBadge = (from, to) => d.emit('legacy:week-range', { from, to });

  function wpInitMainBadge() {
    let from = d.local.get('wp:selectedFrom');
    let to = d.local.get('wp:selectedTo');
    if (!from || !to) { const r = wpGetWeekRange(0); from = r.from; to = r.to; }
    wpUpdateMainBadge(from, to);
  }

  return {
    wkCollections, wprBridge, wkBuildRows, wkReportHtml,
    downloadWeeklyReportWordForRange, printWeeklyReportForRange,
    wpGetWeekRange, wpUpdateMainBadge, wpInitMainBadge,
  };
}
