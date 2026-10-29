// نسخة مجمَّدة من كود «التنقل بين البوابات» القديم (script-10.js قبل المرحلة 32) — مرجع اختبار المطابقة فقط

// ======= PORTAL NAVIGATION =======
const TOOL_TITLES = {
  interview:     '🗂 المقابلات الفردية',
  reintegration: '📋 الإدماج المدرسي',
  absence:       '🚨 التلاميذ الأكثر غياباً',
  iip:           '🧩 البرنامج التدخلي الفردي',
  tasklog:       '📝 سجل المهام اليومي',
  stats:         '📊 الإحصاء البياني',
  casefile:      '📁 ملف الحالة الشامل',
  violence:      '🛡️ التدخل في حالات العنف',
  workshops:     '🎯 الورشات والأنشطة',
  specialneeds:  '♿ التلاميذ في وضعية إعاقة',
  vigilance:     '🚨 خلية اليقظة — الحالات الحرجة',
  printdocs:     '🏥 بوابة الإحالة والإخبار الصحي',
  behavior:      '🧭 رصد السلوك — الدعم وخطة التدخل',
  parents:       '📞 التواصل مع أولياء الأمور',
  followup:      '🔔 المتابعة وتتبع الحالات',
};
const ALL_TOOLS = ['toolInterview','toolReintegration','toolAbsence','toolIip','toolTasklog','toolStats','toolCasefile','toolViolence','toolWorkshops','toolSpecialNeeds','toolVigilance','toolPrintdocs','toolBehavior','toolParents','toolFollowup'];
let _currentTool = null;

function openTool(tool) {
  // Hide portal, deactivate all tools
  document.getElementById('portalLanding').style.display = 'none';
  ALL_TOOLS.forEach(id => { const el=document.getElementById(id); if(el) el.classList.remove('active'); });

  const toolIdMap = {
    interview:'toolInterview', reintegration:'toolReintegration',
    absence:'toolAbsence', iip:'toolIip', tasklog:'toolTasklog', stats:'toolStats',
    casefile:'toolCasefile',
    violence:'toolViolence', workshops:'toolWorkshops',
    specialneeds:'toolSpecialNeeds', vigilance:'toolVigilance',
    printdocs:'toolPrintdocs', behavior:'toolBehavior', parents:'toolParents', followup:'toolFollowup'
  };
  const toolId = toolIdMap[tool];
  if (!toolId) return;
  document.getElementById(toolId).classList.add('active');
  _currentTool = tool;
  window.dispatchEvent(new CustomEvent('legacy:tool-changed', { detail: { tool } }));

  // Show & update frozen nav
  _buildFrozenNav(tool);
  document.getElementById('frozenNav').classList.add('visible');

  // (تهيئة البوابات صارت داخل مكوّنات React: تستمع لحدث legacy:tool-changed)

  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function goBack() {
  ALL_TOOLS.forEach(id => { const el=document.getElementById(id); if(el) el.classList.remove('active'); });
  document.getElementById('portalLanding').style.display = 'block';
  document.getElementById('frozenNav').classList.remove('visible');
  _currentTool = null;
  window.dispatchEvent(new CustomEvent('legacy:tool-changed', { detail: { tool: null } }));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}


// Build the frozen nav icons for all tools except the current one
function _buildFrozenNav(activeTool) {
  const nav = document.getElementById('frozenNav');
  const tools = [
    { key:'interview',     icon:'🗂',  label:'المقابلات' },
    { key:'reintegration', icon:'📋',  label:'الإدماج' },
    { key:'absence',       icon:'🚨',  label:'الغياب' },
    { key:'iip',            icon:'🧩',  label:'البرنامج التدخلي' },
    { key:'stats',         icon:'📊',  label:'الإحصاء' },
    { key:'casefile',      icon:'📁',  label:'ملف الحالة' },
    { key:'violence',      icon:'🛡️',  label:'العنف' },
    { key:'workshops',     icon:'🎯',  label:'الورشات' },
    { key:'specialneeds',  icon:'♿',  label:'الإعاقة' },
    { key:'vigilance',     icon:'🚨',  label:'خلية اليقظة' },
    { key:'printdocs',     icon:'🏥',  label:'الإحالة والإخبار' },
    { key:'behavior',      icon:'🧭',  label:'رصد السلوك' },
    { key:'parents',       icon:'📞',  label:'الأولياء' },
    { key:'followup',      icon:'🔔',  label:'المتابعة' },
  ];
  nav.innerHTML = tools.map(t => `
    <div class="frozen-card${t.key === activeTool ? ' active-tool' : ''}" onclick="openTool('${t.key}')" title="${TOOL_TITLES[t.key]}">
      <div class="frozen-card-icon">${t.icon}</div>
      <div class="frozen-card-label">${((SITE_CFG.gates && SITE_CFG.gates[t.key]) || '').trim() || t.label}</div>
    </div>
  `).join('');
}
