// نسخة مجمَّدة من كود «خلية اليقظة» القديم (script-16.js قبل المرحلة 25) — مرجع اختبار المطابقة فقط

// ══════════════════════════════════════════════════════════
//  💡 اقتراحات جاهزة في مودال تعديل الحالة
// ══════════════════════════════════════════════════════════

const VIG_EDIT_SUGGESTIONS = {
  'عنف مدرسي': {
    actions: [
      ['🎧 جلسة استماع', 'أُجريت جلسة استماع مع التلميذ(ة) للاستماع إلى روايته(ا) وتقييم الأثر النفسي للحادثة.'],
      ['👨‍👩 تواصل مع الأسرة', 'تم التواصل مع ولي الأمر وإبلاغه بالوضعية والإجراءات المتخذة.'],
      ['🏫 إخبار الإدارة', 'تم إخبار إدارة المؤسسة وفتح محضر رسمي بالحادثة.'],
      ['🏛️ إحالة', 'تمت إحالة الملف إلى المصالح المختصة (نيابة / مراكز الحماية الاجتماعية).'],
      ['🤝 وساطة', 'تم تنظيم جلسة وساطة بين الأطراف المعنية بإشراف المختص الاجتماعي.'],
    ],
    notes: [
      ['😟 أثر نفسي', 'التلميذ(ة) يعاني(تعاني) من أثر نفسي ملحوظ جراء حادثة العنف.'],
      ['😤 سلوك عدواني', 'يُلاحَظ على التلميذ(ة) سلوك عدواني متكرر يستدعي متابعة نفسية.'],
      ['👥 نزاع بين تلاميذ', 'الوضعية ناجمة عن نزاع بين تلاميذ داخل المؤسسة.'],
      ['🏠 عنف أسري', 'تشير المعطيات إلى وجود عنف أسري ينعكس على سلوك التلميذ(ة).'],
    ],
  },
  'انقطاع مزمن': {
    actions: [
      ['📞 اتصال بولي الأمر', 'تم الاتصال بولي الأمر لمعرفة أسباب الانقطاع وتحديد موعد للزيارة المنزلية.'],
      ['🏠 زيارة منزلية', 'أُجريت زيارة منزلية للتعرف على الوضع الأسري وتشجيع التلميذ(ة) على العودة.'],
      ['📋 ملف إدماج', 'فُتح ملف إدماج مدرسي ووُضع برنامج للمرافقة والمتابعة التدريجية.'],
      ['📄 إشعار رسمي', 'تم توجيه إشعار رسمي لولي الأمر بضرورة انتظام التلميذ(ة) في الحضور.'],
      ['📘 برنامج دعم', 'سُجّل(ت) التلميذ(ة) في برنامج الدعم التربوي لمعالجة الثغرات الدراسية.'],
    ],
    notes: [
      ['📉 تراجع دراسي', 'الانقطاع المتكرر أدى إلى تراجع ملحوظ في المستوى الدراسي.'],
      ['💰 ظروف اقتصادية', 'يُعزى الانقطاع إلى ظروف اقتصادية صعبة تعيشها الأسرة.'],
      ['🚌 مشكل مواصلات', 'يُعاني التلميذ(ة) من صعوبة في التنقل بسبب بُعد المسكن.'],
      ['😔 عزوف دراسي', 'يُبدي التلميذ(ة) عزوفاً واضحاً عن المدرسة وضعف الدافعية.'],
    ],
  },
  'وضعية أسرية حرجة': {
    actions: [
      ['🎧 جلسة دعم نفسي', 'أُجريت جلسة دعم نفسي واجتماعي للتلميذ(ة) للتخفيف من الانعكاسات السلبية.'],
      ['🤝 تنسيق مع مصالح', 'تم التنسيق مع المصالح الاجتماعية المختصة للتكفل بالأسرة.'],
      ['📋 مرافقة مستمرة', 'وُضع برنامج مرافقة ومتابعة مستمر للتلميذ(ة) بالتنسيق مع الأساتذة.'],
      ['👨‍👩 اجتماع مع الأسرة', 'عُقد اجتماع مع الأسرة لتحديد الاحتياجات ووضع خطة للدعم.'],
    ],
    notes: [
      ['💔 طلاق الوالدين', 'الوضعية ناجمة عن طلاق الوالدين وما خلّفه من أثر نفسي على التلميذ(ة).'],
      ['⚰️ فقدان أحد الوالدين', 'فقد التلميذ(ة) أحد الوالدين مما أثّر سلباً على وضعه(ها) النفسي والدراسي.'],
      ['🏚️ وضع سكني صعب', 'تعيش الأسرة في وضع سكني صعب يؤثر على استقرار التلميذ(ة).'],
      ['👴 كفالة بديلة', 'التلميذ(ة) في كفالة أسرة بديلة — يستدعي متابعة اجتماعية منتظمة.'],
    ],
  },
  'إشكالية نفسية': {
    actions: [
      ['🧠 تقييم نفسي', 'تم إجراء تقييم أولي للوضعية النفسية للتلميذ(ة) وتحديد مستوى الخطورة.'],
      ['🏥 إحالة متخصص', 'تمت إحالة التلميذ(ة) إلى مختص نفسي / طبيب نفسي للمتابعة المتخصصة.'],
      ['👨‍👩 توعية الأسرة', 'تم تنظيم جلسة توعوية مع الأسرة حول أهمية الدعم النفسي والمرافقة.'],
      ['📊 متابعة دورية', 'وُضعت خطة متابعة دورية أسبوعية لرصد تطور الوضعية النفسية.'],
      ['🎨 ورشة تعبيرية', 'سُجّل(ت) التلميذ(ة) في ورشة تعبيرية / فنية لتصريف التوترات النفسية.'],
    ],
    notes: [
      ['😰 قلق مفرط', 'يُعاني(تعاني) التلميذ(ة) من قلق مفرط وتوتر مستمر داخل الفصل.'],
      ['😢 اكتئاب', 'تُلاحَظ على التلميذ(ة) علامات اكتئاب تستدعي تدخلاً نفسياً عاجلاً.'],
      ['😶 انطواء وعزلة', 'يميل(تميل) التلميذ(ة) إلى الانطواء والعزلة عن زملائه(ها).'],
      ['💊 علاج دوائي', 'التلميذ(ة) تحت إشراف طبي ويتناول(تتناول) علاجاً نفسياً — يستدعي التنسيق.'],
    ],
  },
  'تهديد بالتسرب': {
    actions: [
      ['📞 استدعاء ولي الأمر', 'تم استدعاء ولي الأمر وتحسيسه بخطورة التسرب وانعكاساته المستقبلية.'],
      ['📘 برنامج دعم', 'سُجّل(ت) التلميذ(ة) في برنامج الدعم التربوي لمعالجة الثغرات الدراسية.'],
      ['🏛️ توجيه مدرسي', 'تم إجراء جلسة توجيه مدرسي ومهني لتعزيز الدافعية للتمدرس.'],
      ['🤝 ميثاق شراكة', 'وُقّع ميثاق شراكة مع الأسرة يتضمن التزامات الطرفين لضمان الانتظام.'],
      ['🎯 مشروع شخصي', 'ساعد المختص التلميذ(ة) في بناء مشروع شخصي لتحفيزه(ها) على الاستمرار.'],
    ],
    notes: [
      ['📉 تدني المستوى', 'التدني الحاد في المستوى الدراسي يُعدّ العامل الرئيسي لخطر التسرب.'],
      ['💼 ضغط العمل', 'يتعرض(تتعرض) التلميذ(ة) لضغط من الأسرة للعمل المبكر.'],
      ['👫 رفقاء سوء', 'تأثير رفقاء خارج المؤسسة يُحفّز التلميذ(ة) على التغيب والتسرب.'],
      ['🏠 مسؤولية منزلية', 'يتحمل(تتحمل) التلميذ(ة) مسؤوليات منزلية ثقيلة تعيق الانتظام.'],
    ],
  },
  'إعاقة وصعوبات': {
    actions: [
      ['📋 ملف إعاقة', 'تم فتح ملف وضعية الإعاقة وتوثيق المعطيات الطبية والتربوية.'],
      ['🏥 إحالة لجنة', 'تمت إحالة الملف إلى اللجنة الإقليمية المختصة بالتربية الدامجة.'],
      ['📚 تكييف بيداغوجي', 'تم التنسيق مع الهيئة التدريسية لاعتماد تكييفات بيداغوجية ملائمة.'],
      ['🤝 دعم الأسرة', 'تم توعية الأسرة بكيفية مرافقة التلميذ(ة) وتوفير الدعم اللازم.'],
    ],
    notes: [
      ['📖 صعوبات قراءة', 'يُعاني(تعاني) التلميذ(ة) من صعوبات في القراءة والكتابة (عسر القراءة).'],
      ['🔢 صعوبات حساب', 'يُعاني(تعاني) التلميذ(ة) من صعوبات في الحساب والرياضيات.'],
      ['👁️ إعاقة بصرية', 'يستدعي وضع التلميذ(ة) تهيئة بصرية خاصة في الفصل الدراسي.'],
      ['👂 إعاقة سمعية', 'يستفيد(تستفيد) التلميذ(ة) من جلوس أمامي وتعديلات صوتية في الفصل.'],
    ],
  },
  'تعثرات دراسية': {
    actions: [
      ['📚 دعم تربوي', 'سُجّل(ت) التلميذ(ة) في برنامج الدعم التربوي لمعالجة الثغرات والتعثرات الدراسية.'],
      ['📝 تشخيص الثغرات', 'أُجري تشخيص شامل لتحديد مواطن الضعف وتصميم خطة دعم مناسبة.'],
      ['👨‍👩 تواصل مع الأسرة', 'تم التواصل مع الأسرة لإطلاعها على الوضع الدراسي وتفعيل دورها.'],
      ['🎯 أهداف قابلة للقياس', 'وُضعت أهداف دراسية قابلة للقياس مع جدول زمني محدد للمتابعة.'],
      ['📊 خطة دعم فردية', 'صُمّمت خطة دعم فردية تراعي الإيقاع الخاص للتلميذ(ة).'],
    ],
    notes: [
      ['📉 تراجع مستمر', 'يُعاني(تعاني) التلميذ(ة) من تراجع مستمر في النتائج يستدعي تدخلاً فورياً.'],
      ['😔 ضعف الدافعية', 'يُلاحَظ ضعف واضح في الدافعية والرغبة في التعلم.'],
      ['🏠 غياب الدعم الأسري', 'غياب الدعم الدراسي في المنزل يُعمّق التعثرات الدراسية.'],
      ['📚 ثغرات متراكمة', 'الثغرات المتراكمة من سنوات سابقة تُصعّب الاستيعاب الحالي.'],
    ],
  },
  'وضعية صحية': {
    actions: [
      ['🏥 ملف صحي', 'تم فتح ملف طبي وتوثيق الوضعية الصحية بالتنسيق مع الأسرة والمصالح الصحية.'],
      ['🤝 تنسيق مع الأسرة', 'تم التنسيق مع ولي الأمر لمتابعة الوضعية الصحية وتسهيل الحضور.'],
      ['📋 تكييف بيداغوجي', 'أُخبرت الهيئة التدريسية بالوضعية الصحية واتُّخذت تكييفات مناسبة.'],
      ['🔄 متابعة دورية', 'برمجت متابعة دورية لرصد تطور الحالة الصحية وتداعياتها الدراسية.'],
      ['🏛️ إحالة للمصالح الصحية', 'تمت إحالة التلميذ(ة) إلى المصالح الصحية المختصة للتكفل اللازم.'],
    ],
    notes: [
      ['💊 علاج دوائي', 'التلميذ(ة) تحت علاج طبي مستمر يستدعي مرونة في التعامل.'],
      ['🏥 غياب متكرر للعلاج', 'تتسبب المواعيد الطبية في غياب متكرر يؤثر على مساره(ها) الدراسي.'],
      ['😔 انعكاس نفسي', 'تُخلّف الوضعية الصحية انعكاساً نفسياً يستدعي دعماً موازياً.'],
      ['🔄 وضعية مزمنة', 'الوضعية الصحية مزمنة وتستوجب متابعة اجتماعية طويلة الأمد.'],
    ],
  },
  'سلوك عدواني': {
    actions: [
      ['🎧 جلسة استماع', 'أُجريت جلسة استماع تشخيصية لفهم دوافع السلوك العدواني وأسبابه.'],
      ['👨‍👩 استدعاء الأسرة', 'استُدعيت الأسرة وتم التباحث حول الأسباب ووضع خطة تعاون مشتركة.'],
      ['📜 عقد سلوكي', 'وُقّع عقد سلوكي بين التلميذ(ة) والمؤسسة يتضمن التزامات واضحة.'],
      ['🔄 متابعة مكثفة', 'برمجت جلسات متابعة مكثفة للتحقق من تحسن السلوك وتعزيز الإيجابي.'],
      ['🧠 إحالة للمختص النفسي', 'تمت إحالة التلميذ(ة) للمختص النفسي لفهم الجذور العميقة للسلوك.'],
    ],
    notes: [
      ['😤 عدوانية متكررة', 'يُبدي(تُبدي) التلميذ(ة) سلوكاً عدوانياً متكرراً نحو الزملاء والأساتذة.'],
      ['🏠 عنف في المحيط', 'تشير المعطيات إلى تعرض التلميذ(ة) للعنف في محيطه(ها) الأسري.'],
      ['😡 انفعالية حادة', 'يُعاني(تعاني) التلميذ(ة) من صعوبة في ضبط الانفعالات.'],
      ['📉 تأثير سلبي على الأقران', 'يُؤثر السلوك العدواني سلباً على المناخ المدرسي وعلاقاته(ها) بالآخرين.'],
    ],
  },
  'إدمان وانحراف': {
    actions: [
      ['🧠 مرافقة نفسية مكثفة', 'تم فتح ملف مرافقة نفسية واجتماعية مكثفة بالتنسيق مع الجهات المختصة.'],
      ['🏛️ إحالة متخصصة', 'تمت إحالة الحالة إلى مصالح متخصصة للتدخل الطبي والاجتماعي.'],
      ['👨‍👩 توعية الأسرة', 'تم التواصل مع الأسرة وتوعيتها بخطورة الوضعية وسبل المرافقة.'],
      ['🔒 سرية تامة', 'تمت معالجة الملف بسرية تامة مع توثيق كامل للإجراءات.'],
      ['🔄 خطة إنقاذ', 'وُضعت خطة تدخل عاجلة بالتنسيق مع الإدارة والأسرة والجهات المختصة.'],
    ],
    notes: [
      ['🚨 خطورة عالية', 'الوضعية تستدعي تدخلاً عاجلاً وتنسيقاً متعدد الأطراف.'],
      ['😶 إنكار الوضعية', 'يُنكر(تُنكر) التلميذ(ة) وجود إشكالية مما يصعّب التدخل.'],
      ['👥 رفاق سوء', 'تأثير رفاق السوء عامل رئيسي في هذه الوضعية.'],
      ['🏠 غياب الرقابة الأسرية', 'غياب الرقابة الأسرية يُفاقم الوضعية ويستوجب تفعيل دور الأسرة.'],
    ],
  },
  'أخرى': {
    actions: [
      ['🎧 جلسة استماع', 'أُجريت جلسة استماع وتقييم شامل لمعرفة أبعاد الوضعية.'],
      ['📊 خطة متابعة', 'وُضعت خطة متابعة مفصّلة تحدد الأهداف والمراحل والآليات.'],
      ['🏛️ تنسيق', 'تم التنسيق مع الجهات المعنية لتوفير الدعم اللازم.'],
      ['👨‍👩 تواصل مع الأسرة', 'تم عقد لقاء مع ولي الأمر للتباحث في الوضعية وآليات الدعم.'],
    ],
    notes: [
      ['🔍 قيد البحث', 'الوضعية قيد الدراسة والبحث لتحديد الإجراءات المناسبة.'],
      ['📌 متابعة أسبوعية', 'تم برمجة متابعة أسبوعية لرصد تطور الوضعية.'],
    ],
  },
};

function vigEditShowSuggestions() {
  const checkedEdit = Array.from(document.querySelectorAll('input[name="vigEditCategory"]:checked')).map(c => c.value);
  const cat = checkedEdit[0] || ''; // use first selection for suggestions
  const data = VIG_EDIT_SUGGESTIONS[cat];

  const aBox = document.getElementById('vigEditActionsSugg');
  const nBox = document.getElementById('vigEditNotesSugg');
  if (!aBox || !nBox) return;

  const chipStyle = `display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-family:'Cairo',sans-serif;font-size:0.72rem;font-weight:700;cursor:pointer;border:1.5px solid;transition:all 0.15s;`;

  if (!data) { aBox.style.display = 'none'; nBox.style.display = 'none'; return; }

  // اقتراحات الإجراءات
  aBox.style.display = 'flex';
  aBox.innerHTML = `<span style="font-size:0.68rem;font-weight:700;color:#6366f1;width:100%;margin-bottom:2px;">💡 اقتراحات الإجراءات — انقر للإضافة:</span>` +
    data.actions.map(([lbl, txt]) =>
      `<button type="button" onclick="vigEditAppend('vigEditActions','${txt.replace(/'/g,"\\'")}')"
        style="${chipStyle}background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe;"
        onmouseover="this.style.background='#dbeafe'" onmouseout="this.style.background='#eff6ff'">${lbl}</button>`
    ).join('');

  // اقتراحات الملاحظات
  nBox.style.display = 'flex';
  nBox.innerHTML = `<span style="font-size:0.68rem;font-weight:700;color:#6366f1;width:100%;margin-bottom:2px;">💡 اقتراحات الملاحظات — انقر للإضافة:</span>` +
    data.notes.map(([lbl, txt]) =>
      `<button type="button" onclick="vigEditAppend('vigEditNotes','${txt.replace(/'/g,"\\'")}')"
        style="${chipStyle}background:#f5f3ff;color:#5b21b6;border-color:#c4b5fd;"
        onmouseover="this.style.background='#ede9fe'" onmouseout="this.style.background='#f5f3ff'">${lbl}</button>`
    ).join('');
}

function vigEditAppend(fieldId, text) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.value = el.value.trim() ? el.value.trimEnd() + '\n' + text : text;
  el.focus();
  el.style.borderColor = '#3b82f6';
  setTimeout(() => { el.style.borderColor = '#cbd5e1'; }, 1200);
}

// ══════════════════════════════════════════════════════════════
//  🚨 خلية اليقظة — الحالات الحرجة
// ══════════════════════════════════════════════════════════════

const VIG_KEY = 'vigilanceCases';

function vigGetArchive() {
  if (!currentUser) return [];
  const raw = appData[VIG_KEY];
  // إذا كانت المصفوفة تحتوي على بيانات فارجعها مباشرة
  if (Array.isArray(raw) && raw.length > 0) return raw;
  // إذا لم تكن في الذاكرة، جرب localStorage كاحتياطي
  try {
    const ls = localStorage.getItem(currentUser + ':' + VIG_KEY);
    if (ls) {
      const parsed = JSON.parse(ls);
      if (Array.isArray(parsed) && parsed.length > 0) {
        appData[VIG_KEY] = parsed;
        return appData[VIG_KEY];
      }
    }
  } catch {}
  // إذا لم يوجد شيء، تأكد من تهيئة المصفوفة وإرجاعها
  if (!Array.isArray(appData[VIG_KEY])) appData[VIG_KEY] = [];
  return appData[VIG_KEY];
}

async function vigSaveArchive(data) {
  appData[VIG_KEY] = data;
  return await saveUserKey(VIG_KEY);
}

// ── قائمة أنواع الوضعيات المعروفة ──
const VIG_KNOWN_CATEGORIES = [
  'عنف مدرسي','انقطاع مزمن','وضعية أسرية حرجة','إشكالية نفسية',
  'تهديد بالتسرب','إعاقة وصعوبات','أخرى',
  'المواكبة النفسية والاجتماعية','مواكبة نفسية واجتماعية',
  'المواكبة النفسية','مواكبة نفسية','دعم اجتماعي','إعادة إدماج','أخرى'
];

// ── ترحيل البيانات: تصحيح السجلات التي وُضع فيها نوع الوضعية في حقل الإجراءات ──
function vigMigrateArchive(archive) {
  let changed = false;
  archive.forEach(e => {
    const catIsKnown = VIG_KNOWN_CATEGORIES.some(k =>
      (e.category || '').includes(k) || k.includes(e.category || '')
    );
    const actIsMissing = !e.actions || e.actions === '—' || e.actions === '';

    // الحالة القديمة: category صحيح لكن actions فارغ — لا حاجة لتغيير
    if (catIsKnown && actIsMissing) return;

    // حالة الخطأ القديم: category يحتوي على نص طويل (إجراء) وactions فارغ
    const catLooksLikeAction = (e.category || '').length > 40 &&
      !VIG_KNOWN_CATEGORIES.includes(e.category || '');
    if (catLooksLikeAction && actIsMissing) {
      e.actions   = e.category;
      e.category  = 'أخرى';
      changed = true;
    }
  });
  return changed;
}

let vigInitialized = false;

function initVigilance() {
  vigInitialized = true;
  // ربط اسم التلميذ بقائمة التلاميذ (إكمال تلقائي للمسار والقسم والمؤسسة) كما في باقي البوابات
  setTimeout(function () { if (typeof initAllAutocomplete === 'function') initAllAutocomplete(); }, 50);
  // إعادة تحميل بيانات خلية اليقظة من Firebase/localStorage ثم عرضها
  (async () => {
    if (currentUser) {
      try {
        const v = await storageGet(currentUser + ':' + VIG_KEY, true);
        if (v) {
          const parsed = JSON.parse(v);
          if (Array.isArray(parsed)) appData[VIG_KEY] = parsed;
        }
      } catch(e) {
        // الاحتياطي: localStorage
        try {
          const ls = localStorage.getItem(currentUser + ':' + VIG_KEY);
          if (ls) { const p = JSON.parse(ls); if (Array.isArray(p)) appData[VIG_KEY] = p; }
        } catch {}
      }
      // تطبيق الترحيل على البيانات المحملة
      const arch = vigGetArchive();
      if (vigMigrateArchive(arch)) {
        await vigSaveArchive(arch);
        console.info('✅ vigMigrate: تم تصحيح بيانات قديمة تلقائياً');
      }
    }
    const dateEl = document.getElementById('vig_date');
    if (dateEl) dateEl.value = new Date().toISOString().slice(0,10);
    // ملء المؤسسة تلقائياً من الملف الشخصي
    const schoolEl = document.getElementById('vig_school');
    if (schoolEl && !schoolEl.value && userProfile) {
      schoolEl.value = userProfile.institution || userProfile.school || '';
    }
    renderVigArchive();
    vigUpdateKPIs();
    vigShowEmptyFieldHints();
    vigCheckLastImportBtn();
  })();
}

// ── إصلاح يدوي شامل ──
async function vigRepairAllEntries() {
  const archive = vigGetArchive();
  if (!archive.length) { alert('📂 الأرشيف فارغ.'); return; }
  let fixed = 0;
  archive.forEach(e => {
    // إذا category يبدو وكأنه إجراء (نص طويل ليس من الفئات المعروفة)
    const catLooksLikeAction = (e.category || '').length > 40 &&
      !VIG_KNOWN_CATEGORIES.includes(e.category || '');
    const actIsMissing = !e.actions || e.actions === '—' || e.actions === '';
    if (catLooksLikeAction && actIsMissing) {
      e.actions  = e.category;
      e.category = 'أخرى';
      fixed++;
    }
  });
  await vigSaveArchive(archive);
  renderVigArchive();
  vigUpdateKPIs();
  if (fixed > 0) {
    alert(`✅ تم إصلاح ${fixed} سجل — نُقلت بيانات الإجراءات إلى حقلها الصحيح.`);
  } else {
    alert('✅ لا توجد سجلات تحتاج إصلاحاً.');
  }
}

function vigGetRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

function vigVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

async function vigSaveEntry() {
  const name = vigVal('vig_name');
  const date = vigVal('vig_date');
  const category = Array.from(document.querySelectorAll('input[name="vig_category"]:checked')).map(c => c.value).join(' | ');
  const actions = vigVal('vig_actions');
  if (!name) { alert('⚠️ يرجى إدخال اسم التلميذ(ة).'); return; }
  if (!date) { alert('⚠️ يرجى تحديد تاريخ المقابلة.'); return; }
  if (!category) { alert('⚠️ يرجى اختيار نوع الوضعية الحرجة (يمكن اختيار أكثر من واحدة).'); return; }
  if (!actions) { alert('⚠️ يرجى كتابة الإجراءات المتخذة.'); return; }
  const levelEl = document.getElementById('vig_level');
  const levelVal = levelEl ? levelEl.value.trim() : '—';
  const entry = {
    id: Date.now(),
    savedAt: new Date().toLocaleString('ar-MA'),
    studentName: name,
    massar: vigVal('vig_massar') || '—',
    date,
    school: vigVal('vig_school') || (userProfile && userProfile.institution ? userProfile.institution : (userProfile && userProfile.school ? userProfile.school : getInstitutionName())),
    level: levelVal || '—',
    category,
    actions,

    priority: vigGetRadio('vig_priority') || 'متوسطة',
    status: vigGetRadio('vig_status') || 'قيد المتابعة',
    notes: vigVal('vig_notes') || '',
    nextFollowup: vigVal('vig_next_followup') || '—',
    trackingLogs: []
  };

  // ✅ تحديث الواجهة فوراً — الحفظ السحابي في الخلفية
  const archive = vigGetArchive();
  archive.unshift(entry);
  appData[VIG_KEY] = archive;
  renderVigArchive();
  vigUpdateKPIs();
  updateDashboardStats();
  vigClearForm();

  // Toast فوري للمستخدم
  const toast = document.createElement('div');
  toast.textContent = `✅ تم حفظ حالة "${name}" — جارٍ المزامنة السحابية...`;
  Object.assign(toast.style, {
    position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)',
    background:'#2563eb', color:'white', padding:'10px 22px', borderRadius:'10px',
    fontFamily:"'Cairo',sans-serif", fontWeight:'700', fontSize:'0.9rem',
    zIndex:'99999', boxShadow:'0 4px 18px rgba(0,0,0,0.25)', transition:'opacity 0.4s'
  });
  document.body.appendChild(toast);

  // حفظ في الخلفية
  vigSaveArchive(archive).then(ok => {
    toast.textContent = ok
      ? `✅ تم حفظ حالة "${name}" في السحابة بنجاح`
      : `⚠️ تم الحفظ محلياً — تحقق من الاتصال`;
    toast.style.background = ok ? '#16a34a' : '#d97706';
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3000);
  });
}

function vigClearForm() {
  ['vig_name','vig_massar','vig_date','vig_actions','vig_notes','vig_next_followup'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'vig_date' ? new Date().toISOString().slice(0,10) : '';
  });
  // إعادة تعيين المؤسسة من الملف الشخصي
  const schoolEl = document.getElementById('vig_school');
  if (schoolEl) schoolEl.value = (userProfile && userProfile.institution) ? userProfile.institution : ((userProfile && userProfile.school) ? userProfile.school : getInstitutionName());
  // إعادة تعيين القسم
  const levelEl = document.getElementById('vig_level');
  if (levelEl) { if (levelEl.tagName === 'SELECT') levelEl.selectedIndex = 0; else levelEl.value = ''; }
  document.querySelectorAll('input[name^="vig_"]').forEach(r => r.checked = false);
  // إخفاء الاقتراحات
  const sc = document.getElementById('vigSuggestContainer');
  if (sc) sc.innerHTML = '';
  // إظهار تلميحات الحقول الفارغة
  vigShowEmptyFieldHints();
}

function vigShowEmptyFieldHints() {
  const sc = document.getElementById('vigSuggestContainer');
  if (!sc) return;
  sc.innerHTML = `
    <div style="margin-top:8px;background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:10px;padding:10px 14px;">
      <div style="font-size:0.74rem;font-weight:700;color:#0369a1;margin-bottom:6px;">💡 خطوات ملء النموذج:</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        <span style="background:#fff7ed;color:#92400e;border:1.5px solid #fed7aa;border-radius:20px;padding:3px 12px;font-size:0.72rem;font-weight:700;">① ابدأ بكتابة اسم التلميذ(ة) للبحث تلقائياً</span>
        <span style="background:#f0fdf4;color:#166534;border:1.5px solid #bbf7d0;border-radius:20px;padding:3px 12px;font-size:0.72rem;font-weight:700;">② اختر نوع الوضعية لظهور اقتراحات الإجراءات</span>
        <span style="background:#eff6ff;color:#1d4ed8;border:1.5px solid #bfdbfe;border-radius:20px;padding:3px 12px;font-size:0.72rem;font-weight:700;">③ حدد درجة الأولوية والحالة الراهنة</span>
      </div>
    </div>`;
}

function toggleVigArchive() {
  const body = document.getElementById('vigArchiveBody');
  const arrow = document.getElementById('vigArchiveArrow');
  body.classList.toggle('open');
  arrow.textContent = body.classList.contains('open') ? '▲' : '▼';
}

function vigUpdateKPIs() {
  const archive = vigGetArchive();
  const total = archive.length;
  const urgent = archive.filter(e => e.priority === 'عاجلة').length;
  const inProgress = archive.filter(e => e.status === 'قيد المتابعة').length;
  const resolved = archive.filter(e => e.status === 'انتهت المتابعة').length;

  const kpiRow = document.getElementById('vigKpiRow');
  if (!kpiRow) return;
  kpiRow.innerHTML = [
    { val: total,      lbl: 'إجمالي الحالات',  color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', icon: '📋' },
    { val: urgent,     lbl: 'حالات عاجلة',     color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: '🔴' },
    { val: inProgress, lbl: 'قيد المتابعة',    color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '🔶' },
    { val: resolved,   lbl: 'انتهت المتابعة',  color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: '✅' },
  ].map(k => `
    <div style="background:${k.bg};border:2px solid ${k.border};border-radius:12px;padding:12px;text-align:center;">
      <div style="font-size:1.4rem;margin-bottom:2px;">${k.icon}</div>
      <div style="font-size:1.6rem;font-weight:900;color:${k.color};line-height:1;">${k.val}</div>
      <div style="font-size:0.68rem;color:${k.color};font-weight:700;margin-top:3px;">${k.lbl}</div>
    </div>`).join('');
}

let vigSortDir = 'asc'; // 'asc' = الأقدم أولاً | 'desc' = الأحدث أولاً
function vigToggleSort() {
  vigSortDir = vigSortDir === 'asc' ? 'desc' : 'asc';
  const btn = document.getElementById('vigSortBtn');
  if (btn) btn.textContent = vigSortDir === 'asc' ? '📅 التاريخ ↑' : '📅 التاريخ ↓';
  renderVigArchive();
}

function renderVigArchive() {
  const archive = vigGetArchive();
  const search = (document.getElementById('vigArchiveSearch')?.value || '').trim().toLowerCase();
  const countEl = document.getElementById('vigArchiveCount');
  const statsEl = document.getElementById('vigArchiveStats');
  const listEl = document.getElementById('vigArchiveList');
  if (!countEl) return;
  countEl.textContent = archive.length;

  // Stats
  const urgent = archive.filter(e => e.priority === 'عاجلة').length;
  const cats = {};
  archive.forEach(e => { cats[e.category] = (cats[e.category] || 0) + 1; });
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="archive-stat">🚨 الإجمالي: <strong>${archive.length}</strong></div>
      ${urgent ? `<div class="archive-stat" style="background:#fee2e2;border-color:#fca5a5;color:#dc2626;">🔴 عاجلة: <strong>${urgent}</strong></div>` : ''}
      ${Object.entries(cats).map(([c,n]) => `<div class="archive-stat" style="background:#f0fdf4;border-color:#86efac;color:#166534;font-size:0.68rem;">${c}: <strong>${n}</strong></div>`).join('')}
    `;
  }

  const filtered = search ? archive.filter(e =>
    (e.studentName||'').toLowerCase().includes(search) ||
    (e.category||'').toLowerCase().includes(search) ||
    (e.school||'').toLowerCase().includes(search)
  ) : archive;

  // ترتيب حسب تاريخ المقابلة
  filtered.sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    return vigSortDir === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
  });

  if (!filtered.length) {
    listEl.innerHTML = `<div class="archive-empty">${search ? '🔍 لا توجد نتائج.' : '📂 لا توجد حالات محفوظة بعد.<br><small>أضف حالة جديدة يدوياً أو استورد من Excel.</small>'}</div>`;
    return;
  }

  const pColor = {'عاجلة':'#dc2626','عالية':'#c2410c','متوسطة':'#d97706','عادية':'#16a34a'};
  const pBg    = {'عاجلة':'#fee2e2','عالية':'#fff7ed','متوسطة':'#fffbeb','عادية':'#f0fdf4'};
  const sColor = {'قيد المتابعة':'#d97706','تحسن ملحوظ':'#16a34a','تمت الإحالة':'#7c3aed','انتهت المتابعة':'#0f766e'};
  const sBg    = {'قيد المتابعة':'#fffbeb','تحسن ملحوظ':'#f0fdf4','تمت الإحالة':'#f5f3ff','انتهت المتابعة':'#f0fdfa'};

  listEl.innerHTML = `
    <!-- شريط التحكم بالتحديد المتعدد -->
    <div id="vigBulkBar" style="display:none;align-items:center;gap:10px;flex-wrap:wrap;background:#eff6ff;border:1.5px solid #93c5fd;border-radius:10px;padding:10px 14px;margin-bottom:10px;">
      <span id="vigBulkCount" style="font-size:0.84rem;font-weight:700;color:#1d4ed8;">0 حالة محددة</span>
      <button onclick="vigSelectAll()" style="background:#1d4ed8;color:white;border:none;border-radius:7px;padding:5px 14px;font-family:'Cairo',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;">✅ تحديد الكل</button>
      <button onclick="vigDeselectAll()" style="background:#64748b;color:white;border:none;border-radius:7px;padding:5px 14px;font-family:'Cairo',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;">✖ إلغاء التحديد</button>
      <button onclick="vigDeleteSelected()" style="background:linear-gradient(135deg,#dc2626,#991b1b);color:white;border:none;border-radius:7px;padding:5px 16px;font-family:'Cairo',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;margin-right:auto;">🗑 حذف المحددة</button>
    </div>
    <div style="overflow-x:auto;"><table class="archive-table">
    <thead><tr>
      <th style="width:36px;text-align:center;"><input type="checkbox" id="vigCheckAll" onchange="vigToggleAll(this)" style="width:16px;height:16px;cursor:pointer;" title="تحديد الكل"></th>
      <th>#</th><th>اسم التلميذ(ة)</th><th>تاريخ المقابلة</th><th>المؤسسة</th><th>نوع الوضعية</th>
      <th>الإجراءات</th><th>الأولوية</th><th>الحالة</th><th>المتابعة</th><th>الإجراءات</th>
    </tr></thead>
    <tbody>${filtered.map((e, idx) => `<tr id="vigRow_${e.id}">
      <td style="text-align:center;"><input type="checkbox" class="vigRowCheck" data-id="${e.id}" onchange="vigUpdateBulkBar()" style="width:16px;height:16px;cursor:pointer;"></td>
      <td style="text-align:center;color:#64748b;font-size:0.75rem;">${idx+1}</td>
      <td><strong style="color:#dc2626;">🚨 ${e.studentName}</strong></td>
      <td style="white-space:nowrap;text-align:center;">📅 ${e.date}</td>
      <td>${e.school}</td>
      <td><span style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;border-radius:10px;padding:2px 8px;font-size:0.7rem;font-weight:700;">${e.category}</span></td>
      <td style="max-width:220px;font-size:0.74rem;color:#374151;">${(e.actions||'').length > 80
          ? `<span id="vigActShort_${e.id}">${e.actions.slice(0,80)}<span style="color:#94a3b8;">...</span>
              <button onclick="vigToggleActions(${e.id})" style="display:inline;background:none;border:none;color:#2563a8;font-size:0.68rem;font-family:'Cairo',sans-serif;cursor:pointer;font-weight:700;padding:0 2px;" title="عرض الكامل">▼ عرض الكل</button>
            </span>
            <span id="vigActFull_${e.id}" style="display:none;">${e.actions}
              <button onclick="vigToggleActions(${e.id})" style="display:inline;background:none;border:none;color:#2563a8;font-size:0.68rem;font-family:'Cairo',sans-serif;cursor:pointer;font-weight:700;padding:0 2px;">▲ طي</button>
            </span>`
          : (e.actions||'—')}
      </td>
      <td style="text-align:center;">${e.priority !== '—' ? `<span style="background:${pBg[e.priority]||'#f1f5f9'};color:${pColor[e.priority]||'#64748b'};border:1px solid ${pColor[e.priority]||'#cbd5e1'};border-radius:12px;padding:2px 9px;font-size:0.7rem;font-weight:700;">● ${e.priority}</span>` : '—'}</td>
      <td style="text-align:center;"><span style="background:${sBg[e.status]||'#f1f5f9'};color:${sColor[e.status]||'#64748b'};border-radius:10px;padding:2px 8px;font-size:0.7rem;font-weight:700;">${e.status||'—'}</span></td>
      <td style="text-align:center;white-space:nowrap;font-size:0.74rem;color:#0f766e;">${e.nextFollowup !== '—' ? '📅 '+e.nextFollowup : '—'}</td>
      <td style="white-space:nowrap;"><div style="display:flex;gap:5px;justify-content:center;">
        <button onclick="vigEditEntry(${e.id})" style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:white;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:0.72rem;font-family:'Cairo',sans-serif;" title="تعديل">✏️</button>
        <button onclick="vigPreviewCase(${e.id})" style="background:linear-gradient(135deg,#991b1b,#dc2626);color:white;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:0.72rem;font-family:'Cairo',sans-serif;" title="معاينة / طباعة / Word">🖨️</button>
        <button onclick="vigDeleteEntry(${e.id})" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:0.72rem;font-family:'Cairo',sans-serif;">🗑</button>
      </div></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function vigGetSelectedIds() {
  return Array.from(document.querySelectorAll('.vigRowCheck:checked')).map(cb => parseInt(cb.dataset.id));
}

function vigUpdateBulkBar() {
  const selected = vigGetSelectedIds();
  const bar = document.getElementById('vigBulkBar');
  const countEl = document.getElementById('vigBulkCount');
  const allCb = document.getElementById('vigCheckAll');
  const total = document.querySelectorAll('.vigRowCheck').length;
  if (bar) bar.style.display = selected.length > 0 ? 'flex' : 'none';
  if (countEl) countEl.textContent = `${selected.length} حالة محددة`;
  if (allCb) allCb.indeterminate = selected.length > 0 && selected.length < total;
  if (allCb) allCb.checked = selected.length === total && total > 0;
}

function vigToggleAll(cb) {
  document.querySelectorAll('.vigRowCheck').forEach(c => { c.checked = cb.checked; });
  vigUpdateBulkBar();
}

function vigSelectAll() {
  document.querySelectorAll('.vigRowCheck').forEach(c => { c.checked = true; });
  const allCb = document.getElementById('vigCheckAll');
  if (allCb) allCb.checked = true;
  vigUpdateBulkBar();
}

function vigToggleActions(id) {
  const short = document.getElementById('vigActShort_' + id);
  const full  = document.getElementById('vigActFull_'  + id);
  if (!short || !full) return;
  const isExpanded = full.style.display !== 'none';
  short.style.display = isExpanded ? 'inline' : 'none';
  full.style.display  = isExpanded ? 'none'   : 'inline';
}

function vigDeselectAll() {
  document.querySelectorAll('.vigRowCheck').forEach(c => { c.checked = false; });
  const allCb = document.getElementById('vigCheckAll');
  if (allCb) allCb.checked = false;
  vigUpdateBulkBar();
}

async function vigDeleteSelected() {
  const ids = vigGetSelectedIds();
  if (!ids.length) return;
  if (!confirm(`🗑 هل تريد حذف ${ids.length} حالة محددة نهائياً؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) return;
  const newArchive = vigGetArchive().filter(e => !ids.includes(e.id));
  const ok = await vigSaveArchive(newArchive);
  if (ok) {
    renderVigArchive();
    vigUpdateKPIs();
    updateDashboardStats();
  } else {
    alert('❌ فشل الحذف. تحقق من اتصالك وأعد المحاولة.');
  }
}

async function vigDeleteEntry(id) {
  if (!confirm('حذف هذه الحالة؟')) return;
  const ok = await vigSaveArchive(vigGetArchive().filter(e => e.id !== id));
  if (ok) {
    renderVigArchive();
    vigUpdateKPIs();
    updateDashboardStats();
  } else {
    alert('❌ فشل الحذف في Firebase. تحقق من اتصالك وأعد المحاولة.');
  }
}

function vigEditEntry(id) {
  const archive = vigGetArchive();
  const e = archive.find(x => x.id === id);
  if (!e) return;

  // Fill modal fields
  document.getElementById('vigEditId').value        = id;
  document.getElementById('vigEditName').value      = e.studentName || '';
  document.getElementById('vigEditMassar').value    = e.massar !== '—' ? e.massar : '';
  document.getElementById('vigEditDate').value      = e.date   !== '—' ? e.date   : '';
  document.getElementById('vigEditSchool').value    = e.school !== '—' ? e.school : '';
  document.getElementById('vigEditLevel').value     = e.level  !== '—' ? e.level  : '';
  document.getElementById('vigEditActions').value   = e.actions !== '—' ? e.actions : '';
  document.getElementById('vigEditNotes').value     = e.notes  || '';
  document.getElementById('vigEditFollowup').value  = e.nextFollowup !== '—' ? e.nextFollowup : '';

  // Checkbox: category (supports multiple values separated by " | ")
  const catValues = (e.category || '').split(' | ').map(s => s.trim());
  document.querySelectorAll('input[name="vigEditCategory"]').forEach(r => {
    r.checked = catValues.includes(r.value);
  });
  // Radio: priority
  document.querySelectorAll('input[name="vigEditPriority"]').forEach(r => {
    r.checked = r.value === e.priority;
  });
  // Radio: status
  document.querySelectorAll('input[name="vigEditStatus"]').forEach(r => {
    r.checked = r.value === e.status;
  });

  document.getElementById('vigEditModal').style.display = 'flex';
  // إظهار الاقتراحات إذا كانت الفئة محددة مسبقاً
  setTimeout(vigEditShowSuggestions, 50);
}

function vigCloseEditModal() {
  document.getElementById('vigEditModal').style.display = 'none';
}

async function vigSaveEdit() {
  const saveBtn = document.querySelector('#vigEditModal button[onclick="vigSaveEdit()"]');
  const origLabel = '💾 حفظ التعديلات';

  const id      = parseInt(document.getElementById('vigEditId').value);
  const name    = document.getElementById('vigEditName').value.trim();
  if (!name) {
    alert('⚠️ اسم التلميذ(ة) مطلوب.');
    return;
  }

  const category = (() => { const checked = Array.from(document.querySelectorAll('input[name="vigEditCategory"]:checked')).map(c => c.value); return checked.length ? checked.join(' | ') : 'أخرى'; })();
  const priority = (() => { const r = document.querySelector('input[name="vigEditPriority"]:checked'); return r ? r.value : 'متوسطة'; })();
  const status   = (() => { const r = document.querySelector('input[name="vigEditStatus"]:checked');   return r ? r.value : 'قيد المتابعة'; })();

  const archive = vigGetArchive();
  const idx = archive.findIndex(x => x.id === id);
  if (idx === -1) return;

  archive[idx] = {
    ...archive[idx],
    studentName:  name,
    massar:       document.getElementById('vigEditMassar').value.trim()   || '—',
    date:         document.getElementById('vigEditDate').value.trim()     || '—',
    school:       document.getElementById('vigEditSchool').value.trim()   || '—',
    level:        document.getElementById('vigEditLevel').value.trim()    || '—',
    category,
    actions:      document.getElementById('vigEditActions').value.trim()  || '—',
    priority,
    status,
    notes:        document.getElementById('vigEditNotes').value.trim(),
    nextFollowup: document.getElementById('vigEditFollowup').value.trim() || '—',
  };

  // ✅ تحديث الواجهة وإغلاق المودال فوراً — الحفظ السحابي يتم في الخلفية
  appData[VIG_KEY] = archive;
  renderVigArchive();
  vigUpdateKPIs();
  updateDashboardStats();
  vigCloseEditModal();

  // حفظ في الخلفية بدون إيقاف الواجهة
  vigSaveArchive(archive).then(ok => {
    if (ok) {
      const toast = document.createElement('div');
      toast.textContent = '✅ تم الحفظ في السحابة بنجاح';
    Object.assign(toast.style, {
      position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)',
      background:'#16a34a', color:'white', padding:'10px 22px', borderRadius:'10px',
      fontFamily:"'Cairo',sans-serif", fontWeight:'700', fontSize:'0.9rem',
      zIndex:'99999', boxShadow:'0 4px 18px rgba(0,0,0,0.25)', transition:'opacity 0.4s'
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2500);
  } else {
    // فشل الحفظ السحابي — البيانات موجودة محلياً على أي حال
    if (typeof showToast === 'function') {
      showToast('⚠️ فشل الحفظ السحابي — البيانات محفوظة محلياً', 'warning');
    }
  }
  });
}

async function vigClearArchive() {
  const archive = vigGetArchive();
  if (!archive.length) { alert('📂 الأرشيف فارغ بالفعل.'); return; }
  if (!confirm(`⚠️ سيتم حذف جميع حالات خلية اليقظة (${archive.length} حالة) نهائياً.\n\nهل أنت متأكد؟`)) return;
  const ok = await vigSaveArchive([]);
  if (ok) {
    renderVigArchive();
    vigUpdateKPIs();
    updateDashboardStats();
  } else {
    alert('❌ فشل الحذف في Firebase. تحقق من اتصالك وأعد المحاولة.');
  }
}

// ── استيراد من Excel ──
function vigImportFromFile(input) {
  const file = input.files[0];
  if (!file) return;
  const msgEl = document.getElementById('vigImportMsg');
  msgEl.style.color = '#0f766e';
  msgEl.textContent = '⏳ جاري قراءة الملف...';

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (rows.length < 2) { msgEl.style.color='#dc2626'; msgEl.textContent='⚠️ الملف فارغ أو لا يحتوي على بيانات.'; return; }

      // كشف ملفات CSV التي فُقدت فيها الأحرف العربية (مستبدلة بـ ?)
      const flatText = rows.slice(0, 10).flat().join('');
      const qCount = (flatText.match(/\?/g) || []).length;
      const alphaCount = (flatText.match(/[a-zA-Z؀-ۿ]/g) || []).length;
      if (qCount > 5 && qCount > alphaCount) {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = '⚠️ ملف CSV تالف — الأحرف العربية مفقودة. يرجى استخدام ملف Excel (.xlsx) عوضاً عن CSV.';
        return;
      }

      // البحث التلقائي عن صف الرأس في أول 30 صف
      let headerRowIdx = -1;
      let nameCol = -1, classCol = -1, categoryCol = -1, actionsCol = -1,
          dateCol = -1, schoolCol = -1, priorityCol = -1, statusCol = -1,
          notesCol = -1, nextFollowupCol = -1, massarCol = -1;

      const NAME_KEYS        = ['اسم التلميذ(ة)', 'اسم التلميذ', 'الاسم والنسب', 'الاسم', 'اسم', 'الاسم الكامل', 'اسم المتعلم', 'اسم المتعلم(ة)'];
      const CLASS_KEYS       = ['القسم', 'الفصل', 'الشعبة', 'المستوى', 'المستوى الدراسي', 'الفصل الدراسي'];
      const CATEGORY_KEYS    = ['نوع الوضعية الحرجة', 'نوع الوضعية', 'الوضعية الحرجة', 'الوضعية', 'نوع الحالة', 'المواكبة النفسية والاجتماعية', 'نوع المشكل', 'طبيعة الوضعية'];
      const ACTIONS_KEYS     = ['الإجراءات المتخذة', 'الاجراءات المتخذة', 'الإجراءات', 'الاجراءات', 'نوع الاجراء', 'نوع الإجراء', 'الاجراء', 'الإجراء', 'الإجراء المتخذ', 'الإجراءات والدعم', 'الدعم المقدم'];
      const DATE_KEYS        = ['تاريخ المقابلة', 'التاريخ', 'تاريخ', 'تاريخ التدخل', 'تاريخ الرصد'];
      const SCHOOL_KEYS      = ['المؤسسة', 'المدرسة', 'الثانوية', 'الابتدائية', 'اسم المؤسسة', 'المؤسسة التعليمية'];
      const PRIORITY_KEYS    = ['درجة الأولوية', 'الأولوية', 'الاولوية', 'مستوى الأولوية'];
      const STATUS_KEYS      = ['الحالة الراهنة', 'الحالة', 'حالة', 'وضع المتابعة', 'حالة المتابعة'];
      const NOTES_KEYS       = ['ملاحظات', 'ملاحظات إضافية', 'ملاحظات اضافية', 'تعليقات', 'معطيات إضافية'];
      const FOLLOWUP_KEYS    = ['المتابعة القادمة', 'تاريخ المتابعة القادمة', 'المتابعة', 'تاريخ المتابعة', 'الموعد القادم'];
      const MASSAR_KEYS      = ['مسار', 'رمز مسار', 'الرقم الوطني', 'رقم مسار', 'المعرف الوطني'];

      for (let r = 0; r < Math.min(30, rows.length); r++) {
        const hdr = rows[r].map(h => String(h || '').trim());
        const ni = hdr.findIndex(h => NAME_KEYS.includes(h));
        if (ni !== -1) {
          headerRowIdx  = r;
          nameCol       = ni;
          classCol      = hdr.findIndex(h => CLASS_KEYS.includes(h));
          categoryCol   = hdr.findIndex(h => CATEGORY_KEYS.includes(h));
          actionsCol    = hdr.findIndex(h => ACTIONS_KEYS.includes(h));
          dateCol       = hdr.findIndex(h => DATE_KEYS.includes(h));
          schoolCol     = hdr.findIndex(h => SCHOOL_KEYS.includes(h));
          priorityCol   = hdr.findIndex(h => PRIORITY_KEYS.includes(h));
          statusCol     = hdr.findIndex(h => STATUS_KEYS.includes(h));
          notesCol      = hdr.findIndex(h => NOTES_KEYS.includes(h));
          nextFollowupCol = hdr.findIndex(h => FOLLOWUP_KEYS.includes(h));
          massarCol     = hdr.findIndex(h => MASSAR_KEYS.includes(h));
          break;
        }
      }

      if (headerRowIdx === -1) {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = '⚠️ لم يُعثر على عمود الاسم. يجب أن يحتوي الملف على: "اسم التلميذ(ة)" أو "الاسم والنسب"';
        return;
      }

      // رسالة تشخيصية للمطور — تُظهر الأعمدة المكتشفة
      const hdrRow = rows[headerRowIdx];
      console.info('📋 الأعمدة المكتشفة:', {
        name: hdrRow[nameCol], class: classCol>=0?hdrRow[classCol]:'—',
        category: categoryCol>=0?hdrRow[categoryCol]:'—',
        actions: actionsCol>=0?hdrRow[actionsCol]:'—',
        date: dateCol>=0?hdrRow[dateCol]:'—',
        school: schoolCol>=0?hdrRow[schoolCol]:'—',
      });

      let imported = 0;
      const archive = vigGetArchive();
      const now = new Date().toLocaleString('ar-MA');
      const batchId = 'import_' + Date.now();

      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        const nameVal       = String(row[nameCol]         || '').trim();
        const classVal      = classCol       !== -1 ? String(row[classCol]       || '').trim() : '—';
        const categoryVal   = categoryCol    !== -1 ? String(row[categoryCol]    || '').trim() : 'أخرى';
        const actionsVal    = actionsCol     !== -1 ? String(row[actionsCol]     || '').trim() : '—';
        const dateVal       = dateCol        !== -1 ? String(row[dateCol]        || '').trim() : '—';
        const schoolVal     = schoolCol      !== -1 ? String(row[schoolCol]      || '').trim() : '—';
        const priorityVal   = priorityCol    !== -1 ? String(row[priorityCol]    || '').trim() : 'متوسطة';
        const statusVal     = statusCol      !== -1 ? String(row[statusCol]      || '').trim() : 'قيد المتابعة';
        const notesVal      = notesCol       !== -1 ? String(row[notesCol]       || '').trim() : '';
        const followupVal   = nextFollowupCol !== -1 ? String(row[nextFollowupCol] || '').trim() : '—';
        const massarVal     = massarCol      !== -1 ? String(row[massarCol]      || '').trim() : '—';
        if (!nameVal || nameVal.length < 2) continue;

        archive.unshift({
          id: Date.now() + i,
          savedAt: now,
          _importBatch: batchId,
          studentName: nameVal,
          massar: massarVal,
          date: dateVal,
          school: schoolVal,
          level: classVal,
          category: categoryVal || 'أخرى',
          actions: actionsVal,
          priority: priorityVal || 'متوسطة',
          status: statusVal || 'قيد المتابعة',
          notes: notesVal,
          nextFollowup: followupVal,
          trackingLogs: []
        });
        imported++;
      }

      // حفظ معرّف آخر استيراد
      try { localStorage.setItem('vig:lastImportBatch', batchId); localStorage.setItem('vig:lastImportCount', imported); localStorage.setItem('vig:lastImportDate', now); } catch(e) {}

      await vigSaveArchive(archive);
      renderVigArchive();
      vigUpdateKPIs();
      updateDashboardStats();
      vigCheckLastImportBtn();
      msgEl.style.color = '#16a34a';
      msgEl.textContent = `✅ تم استيراد ${imported} تلميذ(ة) بنجاح!`;
      input.value = '';
    } catch(err) {
      msgEl.style.color = '#dc2626';
      msgEl.textContent = '❌ خطأ في قراءة الملف: ' + (err.message || 'تحقق من الصيغة.');
    }
  };
  reader.readAsArrayBuffer(file);
}

// ── حذف آخر استيراد Excel ──
function vigCheckLastImportBtn() {
  const batchId = localStorage.getItem('vig:lastImportBatch');
  const count   = localStorage.getItem('vig:lastImportCount') || '0';
  const date    = localStorage.getItem('vig:lastImportDate') || '';
  const box     = document.getElementById('vigLastImportBox');
  const info    = document.getElementById('vigLastImportInfo');
  if (box) {
    if (batchId) {
      box.style.display = 'flex';
      if (info) info.textContent = `📅 ${date} — ${count} حالة مستوردة`;
    } else {
      box.style.display = 'none';
    }
  }
}

async function vigDeleteLastImport() {
  const batchId = localStorage.getItem('vig:lastImportBatch');
  const count   = localStorage.getItem('vig:lastImportCount') || '0';
  const date    = localStorage.getItem('vig:lastImportDate') || '';
  if (!batchId) { alert('لا يوجد استيراد سابق للحذف.'); return; }
  if (!confirm(`🗑 هل تريد حذف آخر استيراد؟\n\n📅 ${date}\n📋 ${count} حالة مستوردة\n\nسيتم حذف هذه الحالات فقط، والحالات المُدخلة يدوياً ستبقى.`)) return;
  const archive = vigGetArchive();
  const filtered = archive.filter(c => c._importBatch !== batchId);
  const deleted = archive.length - filtered.length;
  await vigSaveArchive(filtered);
  try { localStorage.removeItem('vig:lastImportBatch'); localStorage.removeItem('vig:lastImportCount'); localStorage.removeItem('vig:lastImportDate'); } catch(e) {}
  renderVigArchive();
  vigUpdateKPIs();
  updateDashboardStats();
  vigCheckLastImportBtn();
  const msgEl = document.getElementById('vigImportMsg');
  if (msgEl) { msgEl.style.color = '#dc2626'; msgEl.textContent = `🗑 تم حذف ${deleted} حالة مستوردة بنجاح.`; }
}

// ── تحميل نموذج فارغ ──
function vigDownloadTemplate() {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['اسم التلميذ(ة)', 'تاريخ المقابلة', 'المؤسسة', 'المستوى', 'نوع الوضعية الحرجة', 'الإجراءات المتخذة', 'درجة الأولوية', 'الحالة الراهنة', 'ملاحظات', 'المتابعة القادمة'],
    ['مثال: محمد الحسن', '2026-04-28', 'ابتدائية النور', 'السادسة ابتدائي', 'عنف مدرسي', 'جلسة استماع + تواصل مع الأسرة + إحالة', 'عاجلة', 'قيد المتابعة', '', '2026-05-05'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{wch:25},{wch:15},{wch:20},{wch:20},{wch:25},{wch:40},{wch:15},{wch:20},{wch:25},{wch:15}];
  XLSX.utils.book_append_sheet(wb, ws, 'خلية اليقظة');
  XLSX.writeFile(wb, 'نموذج_خلية_اليقظة.xlsx');
}

// ── تصدير الأرشيف إلى Excel ──
function vigExportExcel() {
  const archive = vigGetArchive();
  if (!archive.length) { alert('📂 الأرشيف فارغ.'); return; }
  const wb = XLSX.utils.book_new();
  const rows = [['#', 'اسم التلميذ(ة)', 'تاريخ المقابلة', 'المؤسسة', 'المستوى', 'نوع الوضعية الحرجة', 'الإجراءات المتخذة', 'الأولوية', 'الحالة الراهنة', 'ملاحظات', 'المتابعة القادمة', 'تاريخ الحفظ']];
  archive.forEach((e, i) => rows.push([
    i+1, e.studentName, e.date, e.school, e.level, e.category,
    e.actions, e.priority, e.status, e.notes, e.nextFollowup, e.savedAt
  ]));
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:5},{wch:25},{wch:15},{wch:20},{wch:20},{wch:25},{wch:45},{wch:12},{wch:18},{wch:30},{wch:15},{wch:22}];
  XLSX.utils.book_append_sheet(wb, ws, 'خلية اليقظة');
  const date = new Date().toLocaleDateString('ar-MA').replace(/\//g,'-');
  XLSX.writeFile(wb, `خلية_اليقظة_${date}.xlsx`);
}

// ── إضافة خلية اليقظة في لوحة الإحصاء ──
// هذه الدالة تُضاف إحصائيات خلية اليقظة إلى بطاقة الإحصاء الخاصة بها وإلى التقرير الأسبوعي
function vigGetStats() {
  const archive = vigGetArchive();
  return {
    total: archive.length,
    urgent: archive.filter(e => e.priority === 'عاجلة').length,
    high: archive.filter(e => e.priority === 'عالية').length,
    inProgress: archive.filter(e => e.status === 'قيد المتابعة').length,
    resolved: archive.filter(e => e.status === 'انتهت المتابعة').length,
    byCategory: archive.reduce((acc, e) => { acc[e.category] = (acc[e.category]||0)+1; return acc; }, {}),
  };
}

// ── اقتراحات الإجراءات حسب نوع الوضعية ──
const VIG_SUGGESTIONS = {
  'عنف مدرسي': [
    ['🎧 جلسة استماع', 'أُجريت جلسة استماع مع التلميذ(ة) للاستماع إلى روايته(ا) وتقييم الأثر النفسي للحادثة.'],
    ['👨‍👩 تواصل مع الأسرة', 'تم التواصل مع ولي الأمر وإبلاغه بالوضعية والإجراءات المتخذة.'],
    ['🏫 إخبار الإدارة', 'تم إخبار إدارة المؤسسة وفتح محضر رسمي بالحادثة.'],
    ['🏛️ إحالة', 'تمت إحالة الملف إلى المصالح المختصة (نيابة / مراكز الحماية الاجتماعية).'],
    ['🤝 وساطة', 'تم تنظيم جلسة وساطة بين الأطراف المعنية بإشراف المختص الاجتماعي.'],
  ],
  'انقطاع مزمن': [
    ['📞 اتصال بولي الأمر', 'تم الاتصال بولي الأمر لمعرفة أسباب الانقطاع وتحديد موعد للزيارة المنزلية.'],
    ['🏠 زيارة منزلية', 'أُجريت زيارة منزلية للتعرف على الوضع الأسري وتشجيع التلميذ(ة) على العودة للمؤسسة.'],
    ['📋 ملف إدماج', 'فُتح ملف إدماج مدرسي وتم وضع برنامج للمرافقة والمتابعة التدريجية.'],
    ['📄 إشعار رسمي', 'تم توجيه إشعار رسمي لولي الأمر بضرورة انتظام التلميذ(ة) في الحضور.'],
  ],
  'وضعية أسرية حرجة': [
    ['🎧 جلسة دعم نفسي', 'أُجريت جلسة دعم نفسي واجتماعي للتلميذ(ة) للتخفيف من الانعكاسات السلبية للوضع الأسري.'],
    ['🤝 تنسيق مع مصالح', 'تم التنسيق مع المصالح الاجتماعية المختصة للتكفل بالأسرة.'],
    ['📋 مرافقة مستمرة', 'وُضع برنامج مرافقة ومتابعة مستمر للتلميذ(ة) بالتنسيق مع الأساتذة والإدارة.'],
  ],
  'إشكالية نفسية': [
    ['🧠 تقييم نفسي', 'تم إجراء تقييم أولي للوضعية النفسية للتلميذ(ة) وتحديد مستوى الخطورة.'],
    ['🏥 إحالة متخصص', 'تمت إحالة التلميذ(ة) إلى مختص نفسي / طبيب نفسي للمتابعة المتخصصة.'],
    ['👨‍👩 توعية الأسرة', 'تم تنظيم جلسة توعوية مع الأسرة حول أهمية الدعم النفسي والمرافقة.'],
    ['📊 متابعة دورية', 'وُضعت خطة متابعة دورية أسبوعية لرصد تطور الوضعية النفسية.'],
  ],
  'تهديد بالتسرب': [
    ['📞 استدعاء ولي الأمر', 'تم استدعاء ولي الأمر إلى المؤسسة وتحسيسه بخطورة التسرب وانعكاساته المستقبلية.'],
    ['📘 برنامج دعم', 'سُجّل(ت) التلميذ(ة) في برنامج الدعم التربوي لمعالجة الثغرات الدراسية.'],
    ['🏛️ توجيه', 'تم إجراء جلسة توجيه مدرسي ومهني مع التلميذ(ة) لتعزيز الدافعية للتمدرس.'],
    ['🤝 شراكة مع الأسرة', 'وُقّع ميثاق شراكة مع الأسرة يتضمن التزامات الطرفين لضمان انتظام التلميذ(ة).'],
  ],
  'إعاقة وصعوبات': [
    ['📋 ملف إعاقة', 'تم فتح ملف وضعية الإعاقة وصعوبات التعلم وتوثيق المعطيات الطبية والتربوية.'],
    ['🏥 إحالة لجنة', 'تمت إحالة الملف إلى اللجنة الإقليمية المختصة بالتربية الدامجة.'],
    ['📚 تكييف بيداغوجي', 'تم التنسيق مع الهيئة التدريسية لاعتماد تكييفات بيداغوجية ملائمة.'],
    ['🤝 دعم الأسرة', 'تم توعية الأسرة بكيفية مرافقة التلميذ(ة) وتوفير الدعم اللازم في المنزل.'],
  ],
  'تعثرات دراسية': [
    ['📚 دعم تربوي', 'سُجّل(ت) التلميذ(ة) في برنامج الدعم التربوي لمعالجة الثغرات والتعثرات الدراسية.'],
    ['📝 تشخيص الثغرات', 'أُجري تشخيص شامل لتحديد مواطن الضعف وتصميم خطة دعم مناسبة.'],
    ['👨‍👩 تواصل مع الأسرة', 'تم التواصل مع الأسرة لإطلاعها على الوضع الدراسي وتفعيل دورها في المرافقة.'],
    ['🎯 أهداف قابلة للقياس', 'وُضعت أهداف دراسية قابلة للقياس مع جدول زمني محدد للمتابعة.'],
    ['📊 خطة دعم فردية', 'صُمّمت خطة دعم فردية تراعي الإيقاع الخاص للتلميذ(ة).'],
  ],
  'وضعية صحية': [
    ['🏥 ملف صحي', 'تم فتح ملف طبي وتوثيق الوضعية الصحية بالتنسيق مع الأسرة والمصالح الصحية.'],
    ['🤝 تنسيق مع الأسرة', 'تم التنسيق مع ولي الأمر لمتابعة الوضعية الصحية وتسهيل الحضور بانتظام.'],
    ['📋 تكييف بيداغوجي', 'أُخبرت الهيئة التدريسية بالوضعية الصحية واتُّخذت تكييفات بيداغوجية مناسبة.'],
    ['🔄 متابعة دورية', 'برمجت متابعة دورية لرصد تطور الحالة الصحية وتداعياتها على المسار الدراسي.'],
    ['🏛️ إحالة للمصالح الصحية', 'تمت إحالة التلميذ(ة) إلى المصالح الصحية المختصة للتكفل اللازم.'],
  ],
  'سلوك عدواني': [
    ['🎧 جلسة استماع', 'أُجريت جلسة استماع تشخيصية لفهم دوافع السلوك العدواني وأسبابه.'],
    ['👨‍👩 استدعاء الأسرة', 'استُدعيت الأسرة وتم التباحث حول الأسباب ووضع خطة تعاون مشتركة.'],
    ['📜 عقد سلوكي', 'وُقّع عقد سلوكي بين التلميذ(ة) والمؤسسة يتضمن التزامات واضحة.'],
    ['🔄 متابعة مكثفة', 'برمجت جلسات متابعة مكثفة للتحقق من تحسن السلوك وتعزيز الإيجابي منه.'],
    ['🧠 إحالة للمختص النفسي', 'تمت إحالة التلميذ(ة) للمختص النفسي لفهم الجذور العميقة للسلوك.'],
  ],
  'إدمان وانحراف': [
    ['🧠 مرافقة نفسية', 'تم فتح ملف مرافقة نفسية واجتماعية مكثفة بالتنسيق مع الجهات المختصة.'],
    ['🏛️ إحالة متخصصة', 'تمت إحالة الحالة إلى مصالح متخصصة (طبية أو اجتماعية) للتدخل المناسب.'],
    ['👨‍👩 توعية الأسرة', 'تم التواصل مع الأسرة وتوعيتها بخطورة الوضعية وسبل المرافقة الفعّالة.'],
    ['🔒 سرية تامة', 'تمت معالجة الملف بسرية تامة مع توثيق الإجراءات في الملف الخاص.'],
    ['🔄 خطة إنقاذ', 'وُضعت خطة تدخل عاجلة بالتنسيق مع الإدارة والأسرة والجهات المختصة.'],
  ],
  'أخرى': [
    ['🎧 جلسة استماع', 'أُجريت جلسة استماع وتقييم شامل لمعرفة أبعاد الوضعية.'],
    ['📊 خطة متابعة', 'وُضعت خطة متابعة مفصّلة تحدد الأهداف والمراحل والآليات.'],
    ['🏛️ تنسيق', 'تم التنسيق مع الجهات المعنية لتوفير الدعم اللازم.'],
  ],
};

// ── تفعيل اقتراحات الإجراءات عند اختيار نوع الوضعية ──
function vigUpdateSuggestions() {
  const checked = Array.from(document.querySelectorAll('input[name="vig_category"]:checked')).map(c => c.value);
  const category = checked[0] || ''; // use first selection for suggestions
  const container = document.getElementById('vigSuggestContainer');
  if (!container) return;
  const suggs = VIG_SUGGESTIONS[category] || [];
  if (!suggs.length) { vigShowEmptyFieldHints(); return; }
  container.innerHTML = `
    <div style="margin-top:8px;">
      <div style="font-size:0.74rem;font-weight:700;color:#64748b;margin-bottom:6px;">💡 اقتراحات جاهزة للإجراءات — انقر لإضافة:</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${suggs.map(s => `
          <button type="button" onclick="vigApplySuggestion('${s[1].replace(/'/g,"\\'")}')"
            style="background:#fff7ed;color:#92400e;border:1.5px solid #fed7aa;border-radius:20px;padding:4px 12px;font-family:'Cairo',sans-serif;font-size:0.74rem;font-weight:700;cursor:pointer;transition:all 0.18s;"
            onmouseover="this.style.background='#fffbeb'" onmouseout="this.style.background='#fff7ed'">
            ${s[0]}
          </button>`).join('')}
      </div>
    </div>`;
}

function vigApplySuggestion(text) {
  const el = document.getElementById('vig_actions');
  if (!el) return;
  el.value = el.value.trim() ? el.value.trimEnd() + '\n' + text : text;
  el.focus();
}

// ── تقرير خلية اليقظة الشامل ──
// بنية موحّدة للطباعة وWord، بنفس ترويسة بقية البوابات:
// الشعار بعرض الورقة ← المديرية ← المؤسسة ← عنوان التقرير
function vigEsc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function vigBuildReportHtml(forWord) {
  const archive = vigGetArchive();
  if (!archive.length) return '';

  const school = ((userProfile && userProfile.school)
    || document.getElementById('vig_school')?.value
    || getInstitutionName() || '').trim() || 'المؤسسة التعليمية';
  const specialist = (userProfile && userProfile.fullName) ? userProfile.fullName : '—';
  const logo = (typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) ? MINISTRY_LOGO_B64 : '';

  const total = archive.length;
  const urgent = archive.filter(e => e.priority === 'عاجلة').length;
  const inProgress = archive.filter(e => e.status === 'قيد المتابعة').length;
  const resolved = archive.filter(e => e.status === 'انتهت المتابعة').length;

  const cats = {};
  archive.forEach(e => { const c = e.category || '—'; cats[c] = (cats[c] || 0) + 1; });
  const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `<tr><td>${vigEsc(c)}</td><td>${n}</td><td>${Math.round(n / total * 100)}%</td></tr>`).join('');

  // في Word تُدمج أسطر الإجراءات بفاصل واضح (الخلية تُقرأ كنص)، وفي الطباعة تبقى أسطرًا
  const actionsCell = e => {
    const lines = String(e.actions || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!lines.length) return '—';
    return lines.map(vigEsc).join(forWord ? ' • ' : '<br>');
  };

  const rows = archive.map((e, i) => `<tr>
      <td>${i + 1}</td>
      <td>${vigEsc(e.studentName || '—')}</td>
      <td>${vigEsc(e.date || '—')}</td>
      <td>${vigEsc(e.level && e.level !== '—' ? e.level : '—')}</td>
      <td>${vigEsc(e.category || '—')}</td>
      <td class="vig-actions">${actionsCell(e)}</td>
      <td>${vigEsc(e.priority || '—')}</td>
      <td>${vigEsc(e.status || '—')}</td>
    </tr>`).join('');

  return `
    <div class="new-report-header">
      <div class="nrh-logo">${logo ? `<img src="${logo}" alt="شعار الوزارة">` : ''}</div>
      <div class="nrh-dir">مديرية الحي الحسني</div>
      <div class="nrh-school">${vigEsc(school)}</div>
      <div class="nrh-title">تقرير خلية اليقظة — التلاميذ في وضعية حرجة</div>
    </div>
    ${specialist !== '—' ? `<div class="report-summary-block" style="text-align:center;">المختص(ة) الاجتماعي(ة): ${vigEsc(specialist)}</div>` : ''}

    <div class="report-section-title">ملخص الحالات</div>
    <table class="wk-table-report"><thead><tr>
      <th data-w="1">إجمالي الحالات</th><th data-w="1">الحالات العاجلة</th><th data-w="1">قيد المتابعة</th><th data-w="1">انتهت المتابعة</th>
    </tr></thead><tbody><tr><td>${total}</td><td>${urgent}</td><td>${inProgress}</td><td>${resolved}</td></tr></tbody></table>

    <div class="report-section-title">توزيع الحالات حسب نوع الوضعية</div>
    <table class="wk-table-report"><thead><tr>
      <th data-w="3">نوع الوضعية</th><th data-w="1">عدد الحالات</th><th data-w="1">النسبة</th>
    </tr></thead><tbody>${catRows}</tbody></table>

    <div class="report-section-title">سجل الحالات الحرجة (${total} حالة)</div>
    <table class="wk-table-report vig-main"><thead><tr>
      <th data-w="0.5">#</th><th data-w="2.2">اسم التلميذ(ة)</th><th data-w="1.3">التاريخ</th><th data-w="1.2">القسم</th>
      <th data-w="1.8">نوع الوضعية</th><th data-w="4.5">الإجراءات المتخذة</th><th data-w="1">الأولوية</th><th data-w="1.3">الحالة</th>
    </tr></thead><tbody>${rows}</tbody></table>

    <div class="sig-wrap">
      <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
      <div class="sig-block"><div class="sig-line"></div>الحارس العام</div>
      <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
    </div>`;
}

// ── طباعة إطارية موحّدة (تُستعمل في التقرير الشامل وبطاقة الحالة) ──
function vigPrintInFrame(frameId, bodyHtml, css) {
  const old = document.getElementById(frameId); if (old) old.remove();
  const fr = document.createElement('iframe');
  fr.id = frameId;
  fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(fr);
  const d = fr.contentWindow.document;
  d.open();
  d.write('<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title> </title><style>' + css + '</style></head><body>' +
    '<table class="pg"><thead><tr><td></td></tr></thead><tbody><tr><td>' + bodyHtml + '</td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>');
  d.close();

  // الطباعة بعد جاهزية الشعار والخط (أو بعد مهلة قصيرة)
  let printed = false;
  const go = function () {
    if (printed) return; printed = true;
    try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { console.warn(e); }
    setTimeout(function () { fr.remove(); }, 60000);
  };
  const img = d.querySelector('.nrh-logo img');
  const logoReady = new Promise(function (res) {
    if (!img || img.complete) return res();
    img.onload = res; img.onerror = res;
  });
  const fontsReady = (d.fonts && d.fonts.ready) ? d.fonts.ready.catch(function () {}) : Promise.resolve();
  Promise.race([
    Promise.all([logoReady, fontsReady]),
    new Promise(function (res) { setTimeout(res, 2500); })
  ]).then(function () { setTimeout(go, 150); });
}

// ══════════════════════════════════════════════════════════════
//  🗂️ بطاقة الحالة الفردية: معاينة ← طباعة / تحميل Word
// ══════════════════════════════════════════════════════════════
function vigCaseStyles(scope) {
  const s = scope ? scope + ' ' : '';
  return `
    ${s}.nrh-logo { text-align: center; line-height: 0; }
    ${s}.nrh-logo img { width: 100%; max-height: 120px; object-fit: contain; }
    ${s}.nrh-dir, ${s}.nrh-school { text-align: center; font-weight: 700; font-size: 11pt; margin: 2px 0; }
    ${s}.nrh-title { text-align: center; font-weight: 900; font-size: 14pt; margin: 6px 0 4px; padding-top: 6px; border-top: 1.5px solid #000; }
    ${s}.report-section-title { font-weight: 800; font-size: 11pt; margin: 12px 0 6px; break-after: avoid; }
    ${s}.report-summary-block { white-space: pre-line; font-size: 10pt; line-height: 1.9; margin-bottom: 6px; border: 1px solid #000; padding: 6px 10px; text-align: right; }
    ${s}.vig-meta { text-align: center; font-size: 9.5pt; margin-bottom: 4px; line-height: 1.7; }
    ${s}table.info-table-report, ${s}table.wk-table-report { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    ${s}table.info-table-report td, ${s}table.wk-table-report th, ${s}table.wk-table-report td { border: 1px solid #000; padding: 5px 7px; font-size: 9.5pt; text-align: right; vertical-align: middle; }
    ${s}table.info-table-report td.info-lbl { background: #d9d9d9; font-weight: 800; width: 18%; white-space: nowrap; }
    ${s}table.info-table-report td.info-val { width: 32%; }
    ${s}table.wk-table-report th { background: #d9d9d9; font-weight: 800; }
    ${s}table.wk-table-report thead { display: table-header-group; }
    ${s}table.wk-table-report tr { break-inside: avoid; page-break-inside: avoid; }
    ${s}.sig-wrap { display: flex; justify-content: space-around; margin-top: 30px; break-inside: avoid; }
    ${s}.sig-block { text-align: center; font-weight: 700; font-size: 10pt; min-width: 150px; }
    ${s}.sig-line { height: 40px; border-bottom: 1.5px solid #000; margin-bottom: 6px; }`;
}

function vigBuildCaseHtml(e) {
  const school = ((e.school && e.school !== '—') ? e.school
    : (userProfile && userProfile.school) ? userProfile.school
    : (document.getElementById('vig_school')?.value || getInstitutionName() || '')).trim() || 'المؤسسة التعليمية';
  const specialist = (userProfile && userProfile.fullName) ? userProfile.fullName : '—';
  const logo = (typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) ? MINISTRY_LOGO_B64 : '';
  const v = x => vigEsc(x && x !== '—' ? x : '—');
  const logs = e.trackingLogs || [];

  const logRows = logs.length
    ? logs.map((l, i) => `<tr><td>${i + 1}</td><td>${v(l.date)}</td><td>${v(l.result)}</td><td>${v(l.note)}</td><td>${v(l.nextDate)}</td></tr>`).join('')
    : `<tr><td>—</td><td>—</td><td>لم تُسجَّل أي جلسة متابعة بعد.</td><td>—</td><td>—</td></tr>`;

  const notes = String(e.notes || '').trim();

  return `
    <div class="new-report-header">
      <div class="nrh-logo">${logo ? `<img src="${logo}" alt="شعار الوزارة">` : ''}</div>
      <div class="nrh-dir">مديرية الحي الحسني</div>
      <div class="nrh-school">${vigEsc(school)}</div>
      <div class="nrh-title">بطاقة خلية اليقظة — تلميذ(ة) في وضعية حرجة</div>
    </div>
    ${specialist !== '—' ? `<div class="report-summary-block vig-meta" style="border:0;text-align:center;white-space:normal;">المختص(ة) الاجتماعي(ة): ${vigEsc(specialist)}</div>` : ''}

    <div class="report-section-title">معلومات التلميذ(ة)</div>
    <table class="info-table-report"><tbody>
      <tr><td class="info-lbl">الاسم الكامل:</td><td class="info-val">${v(e.studentName)}</td><td class="info-lbl">رقم المسار:</td><td class="info-val">${v(e.massar)}</td></tr>
      <tr><td class="info-lbl">المؤسسة التعليمية:</td><td class="info-val">${vigEsc(school)}</td><td class="info-lbl">القسم:</td><td class="info-val">${v(e.level)}</td></tr>
      <tr><td class="info-lbl">تاريخ المقابلة:</td><td class="info-val">${v(e.date)}</td><td class="info-lbl">تاريخ التوثيق:</td><td class="info-val">${v(e.savedAt)}</td></tr>
      <tr><td class="info-lbl">نوع الوضعية الحرجة:</td><td class="info-val" colspan="3">${v(e.category)}</td></tr>
      <tr><td class="info-lbl">درجة الأولوية:</td><td class="info-val">${v(e.priority)}</td><td class="info-lbl">الحالة الراهنة:</td><td class="info-val">${v(e.status)}</td></tr>
    </tbody></table>

    <div class="report-section-title">الإجراءات المتخذة</div>
    <div class="report-summary-block">${vigEsc(String(e.actions || '').trim() || 'لم تُسجَّل إجراءات بعد.')}</div>
    ${notes ? `<div class="report-section-title">ملاحظات إضافية</div><div class="report-summary-block">${vigEsc(notes)}</div>` : ''}

    <div class="report-section-title">سجل جلسات المتابعة (${logs.length} جلسة)</div>
    <table class="wk-table-report"><thead><tr>
      <th data-w="0.5">#</th><th data-w="1.4">التاريخ</th><th data-w="2.4">النتيجة</th><th data-w="3.4">الملاحظات</th><th data-w="1.4">الموعد القادم</th>
    </tr></thead><tbody>${logRows}</tbody></table>

    <div class="sig-wrap">
      <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
      <div class="sig-block"><div class="sig-line"></div>الحارس العام</div>
      <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
    </div>`;
}

function vigEnsureCaseModal() {
  let m = document.getElementById('vigCasePreviewModal');
  if (m) return m;
  const st = document.createElement('style');
  st.id = 'vigCasePreviewStyle';
  st.textContent = '#vigCasePreviewBody{font-family:\'Cairo\',Arial,sans-serif;direction:rtl;color:#000;}' + vigCaseStyles('#vigCasePreviewBody');
  document.head.appendChild(st);

  m = document.createElement('div');
  m.id = 'vigCasePreviewModal';
  m.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:8000;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';
  m.innerHTML = `
    <div style="background:#fff;border-radius:16px;width:100%;max-width:900px;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);direction:rtl;font-family:'Cairo',sans-serif;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0a1f3d,#1a3a5c);padding:16px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="color:#f0d97a;font-weight:800;font-size:0.95rem;">معاينة بطاقة خلية اليقظة</div>
          <div id="vigCasePreviewName" style="color:rgba(255,255,255,0.7);font-size:0.75rem;margin-top:2px;"></div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button onclick="vigCasePrint()" style="background:linear-gradient(135deg,#991b1b,#dc2626);color:white;border:none;border-radius:8px;padding:8px 16px;font-family:'Cairo',sans-serif;font-size:0.8rem;font-weight:700;cursor:pointer;">🖨️ طباعة</button>
          <button onclick="vigCaseWord()" style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:white;border:none;border-radius:8px;padding:8px 16px;font-family:'Cairo',sans-serif;font-size:0.8rem;font-weight:700;cursor:pointer;">📄 تحميل Word</button>
          <button onclick="vigCaseClose()" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:white;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:1rem;font-weight:700;">✕</button>
        </div>
      </div>
      <div style="background:#e5e7eb;padding:16px;">
        <div id="vigCasePreviewBody" style="background:#fff;max-width:760px;margin:0 auto;padding:12mm 12mm;box-shadow:0 2px 12px rgba(0,0,0,0.18);"></div>
      </div>
    </div>`;
  m.addEventListener('click', function (ev) { if (ev.target === m) vigCaseClose(); });
  document.body.appendChild(m);
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') vigCaseClose(); });
  return m;
}

function vigCaseCurrent() {
  const id = window._vigCaseId;
  return vigGetArchive().find(x => String(x.id) === String(id)) || null;
}

// فتح المعاينة (الزر 🖨️ في الأرشيف)
function vigPreviewCase(id) {
  const e = vigGetArchive().find(x => String(x.id) === String(id));
  if (!e) return;
  window._vigCaseId = id;
  const m = vigEnsureCaseModal();
  document.getElementById('vigCasePreviewBody').innerHTML = vigBuildCaseHtml(e);
  document.getElementById('vigCasePreviewName').textContent = e.studentName || '';
  m.style.display = 'flex';
  m.scrollTop = 0;
}

function vigCaseClose() {
  const m = document.getElementById('vigCasePreviewModal');
  if (m) m.style.display = 'none';
}

function vigCasePrint() {
  const e = vigCaseCurrent(); if (!e) return;
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; color: #000; padding: 0 12mm;
           -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    table.pg { width: 100%; border-collapse: collapse; }
    table.pg > thead > tr > td, table.pg > tfoot > tr > td { padding: 0; border: 0; height: 10mm; }
    table.pg > tbody > tr > td { padding: 0; border: 0; }` + vigCaseStyles('');
  vigPrintInFrame('vigCasePrintFrame', vigBuildCaseHtml(e), css);
}

async function vigCaseWord() {
  const e = vigCaseCurrent(); if (!e) return;
  const host = document.createElement('div');
  host.id = 'vigCaseContent';
  host.style.cssText = 'position:absolute;left:-99999px;top:0;width:800px;';
  host.innerHTML = vigBuildCaseHtml(e);
  document.body.appendChild(host);
  try {
    const safe = String(e.studentName || 'تلميذ').replace(/[\\/:*?"<>|\s]+/g, '_');
    await exportToWord('vigCaseContent', 'بطاقة_اليقظة_' + safe + '_' + new Date().toISOString().slice(0, 10));
  } catch (err) {
    console.error(err);
    alert('تعذّر إنشاء ملف Word. حاول مرة أخرى.');
  } finally {
    host.remove();
  }
}

// ── طباعة تقرير خلية اليقظة (A4 أفقي، ترويسة بالشعار) ──
function vigPrintFullReport() {
  const body = vigBuildReportHtml(false);
  if (!body) { alert(' الأرشيف فارغ — لا يمكن إنشاء التقرير.'); return; }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; color: #000; padding: 0 12mm; font-size: 10pt;
           -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    /* تكرار هامش علوي/سفلي في كل صفحة */
    table.pg { width: 100%; border-collapse: collapse; }
    table.pg > thead > tr > td, table.pg > tfoot > tr > td { padding: 0; border: 0; height: 9mm; }
    table.pg > tbody > tr > td { padding: 0; border: 0; }
    .nrh-logo { text-align: center; line-height: 0; }
    .nrh-logo img { width: 100%; max-height: 120px; object-fit: contain; }
    .nrh-dir, .nrh-school { text-align: center; font-weight: 700; font-size: 11pt; margin: 2px 0; }
    .nrh-title { text-align: center; font-weight: 900; font-size: 15pt; margin: 6px 0 4px; padding-top: 6px; border-top: 1.5px solid #000; }
    .report-section-title { font-weight: 800; font-size: 11pt; margin: 12px 0 6px; break-after: avoid; }
    .report-summary-block { text-align: center; font-size: 9.5pt; margin-bottom: 4px; line-height: 1.7; }
    table.wk-table-report { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    table.wk-table-report th, table.wk-table-report td { border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; text-align: right; vertical-align: middle; }
    table.wk-table-report th { background: #d9d9d9; font-weight: 800; }
    table.wk-table-report thead { display: table-header-group; }
    table.wk-table-report tr { break-inside: avoid; page-break-inside: avoid; }
    table.vig-main td.vig-actions { line-height: 1.6; }
    .sig-wrap { display: flex; justify-content: space-around; margin-top: 30px; break-inside: avoid; }
    .sig-block { text-align: center; font-weight: 700; font-size: 10pt; min-width: 160px; }
    .sig-line { height: 40px; border-bottom: 1.5px solid #000; margin-bottom: 6px; }`;

  vigPrintInFrame('vigPrintFrame', body, css);
}

// ── تحميل تقرير خلية اليقظة بصيغة Word (.docx) بنفس ترويسة الطباعة ──
async function vigDownloadWord() {
  const body = vigBuildReportHtml(true);
  if (!body) { alert(' الأرشيف فارغ — لا يمكن إنشاء التقرير.'); return; }
  const host = document.createElement('div');
  host.id = 'vigReportContent';
  host.setAttribute('data-landscape', '1');
  host.style.cssText = 'position:absolute;left:-99999px;top:0;width:1000px;';
  host.innerHTML = body;
  document.body.appendChild(host);
  try {
    const stamp = new Date().toISOString().slice(0, 10);
    await exportToWord('vigReportContent', 'تقرير_خلية_اليقظة_' + stamp);
  } catch (err) {
    console.error(err);
    alert('تعذّر إنشاء ملف Word. حاول مرة أخرى.');
  } finally {
    host.remove();
  }
}

// ── ══════════════════════════════════════════════════════════════
//  نهاية خلية اليقظة
// ══════════════════════════════════════════════════════════════
