// خلية اليقظة — الحالات الحرجة. منطق خالص (بلا DOM) منقول من كتلة «خلية اليقظة» في script-16.js القديم،
// ومُختبَر بمطابقة النسخة المجمَّدة tests/fixtures/vigilance.step25.js (tests/vigilance.parity.test.js).

export const VIG_KEY = 'vigilanceCases';

// ── الخيارات (بترتيبها في النموذج القديم؛ الترتيب مهم: تُحفظ الفئات المختارة بترتيب ظهورها لا بترتيب النقر) ──
export const VIG_CATEGORIES = [
  'عنف مدرسي', 'انقطاع مزمن', 'وضعية أسرية حرجة', 'إشكالية نفسية', 'تهديد بالتسرب', 'إعاقة وصعوبات',
  'تعثرات دراسية', 'وضعية صحية', 'سلوك عدواني', 'إدمان وانحراف', 'أخرى',
];
// [القيمة المخزَّنة، النص الظاهر]
export const PRIORITY_OPTIONS = [['عاجلة', 'عاجلة'], ['عالية', 'عالية'], ['متوسطة', 'متوسطة'], ['عادية', 'عادية']];
export const STATUS_OPTIONS = [['قيد المتابعة', 'قيد المتابعة'], ['تحسن ملحوظ', 'تحسن ملحوظ'], ['تمت الإحالة', 'تمت الإحالة'], ['انتهت المتابعة', 'انتهت']];

export const P_COLOR = { 'عاجلة': '#dc2626', 'عالية': '#c2410c', 'متوسطة': '#d97706', 'عادية': '#16a34a' };
export const P_BG = { 'عاجلة': '#fee2e2', 'عالية': '#fff7ed', 'متوسطة': '#fffbeb', 'عادية': '#f0fdf4' };
export const S_COLOR = { 'قيد المتابعة': '#d97706', 'تحسن ملحوظ': '#16a34a', 'تمت الإحالة': '#7c3aed', 'انتهت المتابعة': '#0f766e' };
export const S_BG = { 'قيد المتابعة': '#fffbeb', 'تحسن ملحوظ': '#f0fdf4', 'تمت الإحالة': '#f5f3ff', 'انتهت المتابعة': '#f0fdfa' };

export const VIG_KNOWN_CATEGORIES = [
  'عنف مدرسي', 'انقطاع مزمن', 'وضعية أسرية حرجة', 'إشكالية نفسية',
  'تهديد بالتسرب', 'إعاقة وصعوبات', 'أخرى',
  'المواكبة النفسية والاجتماعية', 'مواكبة نفسية واجتماعية',
  'المواكبة النفسية', 'مواكبة نفسية', 'دعم اجتماعي', 'إعادة إدماج', 'أخرى',
];

// ── اقتراحات الإجراءات في النموذج [التسمية، النص] — منقولة حرفياً ──
export const VIG_SUGGESTIONS = {
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

// ── اقتراحات الإجراءات والملاحظات في نافذة التعديل — منقولة حرفياً ──
export const VIG_EDIT_SUGGESTIONS = {
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

export const MSG = {
  NAME: '⚠️ يرجى إدخال اسم التلميذ(ة).',
  DATE: '⚠️ يرجى تحديد تاريخ المقابلة.',
  CATEGORY: '⚠️ يرجى اختيار نوع الوضعية الحرجة (يمكن اختيار أكثر من واحدة).',
  ACTIONS: '⚠️ يرجى كتابة الإجراءات المتخذة.',
  EDIT_NAME: '⚠️ اسم التلميذ(ة) مطلوب.',
  EMPTY_ARCHIVE: '📂 الأرشيف فارغ.',
  ARCHIVE_ALREADY_EMPTY: '📂 الأرشيف فارغ بالفعل.',
  REPORT_EMPTY: ' الأرشيف فارغ — لا يمكن إنشاء التقرير.',
  WORD_FAIL: 'تعذّر إنشاء ملف Word. حاول مرة أخرى.',
  CONFIRM_DELETE: 'حذف هذه الحالة؟',
  CONFIRM_DELETE_SELECTED: (n) => `🗑 هل تريد حذف ${n} حالة محددة نهائياً؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
  CONFIRM_CLEAR_ARCHIVE: (n) => `⚠️ سيتم حذف جميع حالات خلية اليقظة (${n} حالة) نهائياً.\n\nهل أنت متأكد؟`,
  DELETE_FAIL: '❌ فشل الحذف. تحقق من اتصالك وأعد المحاولة.',
  DELETE_FAIL_FB: '❌ فشل الحذف في Firebase. تحقق من اتصالك وأعد المحاولة.',
  NO_LAST_IMPORT: 'لا يوجد استيراد سابق للحذف.',
  CONFIRM_DELETE_LAST_IMPORT: (date, count) => `🗑 هل تريد حذف آخر استيراد؟\n\n📅 ${date}\n📋 ${count} حالة مستوردة\n\nسيتم حذف هذه الحالات فقط، والحالات المُدخلة يدوياً ستبقى.`,
  REPAIR_NONE: '✅ لا توجد سجلات تحتاج إصلاحاً.',
  REPAIR_DONE: (n) => `✅ تم إصلاح ${n} سجل — نُقلت بيانات الإجراءات إلى حقلها الصحيح.`,
  READING: '⏳ جاري قراءة الملف...',
  IMPORT_EMPTY: '⚠️ الملف فارغ أو لا يحتوي على بيانات.',
  IMPORT_BAD_CSV: '⚠️ ملف CSV تالف — الأحرف العربية مفقودة. يرجى استخدام ملف Excel (.xlsx) عوضاً عن CSV.',
  IMPORT_NO_NAME: '⚠️ لم يُعثر على عمود الاسم. يجب أن يحتوي الملف على: "اسم التلميذ(ة)" أو "الاسم والنسب"',
  IMPORT_OK: (n) => `✅ تم استيراد ${n} تلميذ(ة) بنجاح!`,
  IMPORT_ERR: (m) => '❌ خطأ في قراءة الملف: ' + (m || 'تحقق من الصيغة.'),
  IMPORT_DELETED: (n) => `🗑 تم حذف ${n} حالة مستوردة بنجاح.`,
  SAVED_PENDING: (name) => `✅ تم حفظ حالة "${name}" — جارٍ المزامنة السحابية...`,
  SAVED_CLOUD: (name) => `✅ تم حفظ حالة "${name}" في السحابة بنجاح`,
  SAVED_LOCAL: '⚠️ تم الحفظ محلياً — تحقق من الاتصال',
  EDIT_SAVED_CLOUD: '✅ تم الحفظ في السحابة بنجاح',
  EDIT_SAVED_LOCAL: '⚠️ فشل الحفظ السحابي — البيانات محفوظة محلياً',
};

export const vigEsc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const todayIso = (now = new Date()) => now.toISOString().slice(0, 10);

export const toggleIn = (list, x) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

// الفئات المختارة بترتيب ظهورها في النموذج (كما تقرؤها querySelectorAll القديمة)
export const orderedCategories = (selected) => VIG_CATEGORIES.filter((c) => selected.includes(c));

// أول فئة مختارة بترتيب النموذج → تحدد الاقتراحات المعروضة
export const firstCategory = (selected) => orderedCategories(selected)[0] || '';
export const suggestionsFor = (selected) => VIG_SUGGESTIONS[firstCategory(selected)] || [];
export const editSuggestionsFor = (selected) => VIG_EDIT_SUGGESTIONS[firstCategory(selected)] || null;

// إضافة نص اقتراح إلى حقل: سطر جديد إن كان الحقل غير فارغ (vigApplySuggestion / vigEditAppend القديمتان)
export const appendLine = (value, text) => (String(value || '').trim() ? String(value).trimEnd() + '\n' + text : text);

// ── قراءة الأرشيف: القديم يرجع [] بلا مستخدم، ويجرّب localStorage إن كانت المجموعة فارغة في الذاكرة ──
export function getArchive(raw, ctx) {
  if (!ctx || !ctx.user) return [];
  if (Array.isArray(raw) && raw.length > 0) return raw;
  try {
    const ls = ctx.storage && ctx.storage.getItem(ctx.user + ':' + VIG_KEY);
    if (ls) {
      const parsed = JSON.parse(ls);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* كالقديم: نتجاهل */ }
  return Array.isArray(raw) ? raw : [];
}

// ── ترحيل البيانات: تصحيح السجلات التي وُضع فيها نوع الوضعية في حقل الإجراءات ──
// (القديم يعدّل السجلات في مكانها؛ هنا نُرجع نسخة جديدة ونُبلغ هل تغيّر شيء)
export function migrateArchive(archive) {
  let changed = false;
  const out = archive.map((e) => {
    const catIsKnown = VIG_KNOWN_CATEGORIES.some((k) =>
      (e.category || '').includes(k) || k.includes(e.category || ''));
    const actIsMissing = !e.actions || e.actions === '—' || e.actions === '';
    if (catIsKnown && actIsMissing) return e;
    const catLooksLikeAction = (e.category || '').length > 40 &&
      !VIG_KNOWN_CATEGORIES.includes(e.category || '');
    if (catLooksLikeAction && actIsMissing) {
      changed = true;
      return { ...e, actions: e.category, category: 'أخرى' };
    }
    return e;
  });
  return { archive: out, changed };
}

// ── «إصلاح البيانات» اليدوي (بلا شرط catIsKnown المسبق) ──
export function repairArchive(archive) {
  let fixed = 0;
  const out = archive.map((e) => {
    const catLooksLikeAction = (e.category || '').length > 40 &&
      !VIG_KNOWN_CATEGORIES.includes(e.category || '');
    const actIsMissing = !e.actions || e.actions === '—' || e.actions === '';
    if (catLooksLikeAction && actIsMissing) {
      fixed++;
      return { ...e, actions: e.category, category: 'أخرى' };
    }
    return e;
  });
  return { archive: out, fixed };
}

// ── المؤشرات والإحصاءات ──
export function kpis(archive) {
  return {
    total: archive.length,
    urgent: archive.filter((e) => e.priority === 'عاجلة').length,
    inProgress: archive.filter((e) => e.status === 'قيد المتابعة').length,
    resolved: archive.filter((e) => e.status === 'انتهت المتابعة').length,
  };
}

export function archiveStats(archive) {
  const cats = {};
  archive.forEach((e) => { cats[e.category] = (cats[e.category] || 0) + 1; });
  return {
    total: archive.length,
    urgent: archive.filter((e) => e.priority === 'عاجلة').length,
    cats: Object.entries(cats),
  };
}

// ── الترتيب بتاريخ المقابلة: 'asc' الأقدم أولاً | 'desc' الأحدث أولاً ──
// القديم كان يرتّب مصفوفة الذاكرة نفسها عند كل عرض، فيخرج التقرير الشامل وملف Excel بترتيب الجدول الظاهر؛ نُبقي هذا الأثر بترتيب صريح.
export function sortByDate(list, dir) {
  return list.slice().sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    return dir === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
  });
}

export function filterSort(archive, search, dir) {
  const q = String(search || '').trim().toLowerCase();
  const filtered = q ? archive.filter((e) =>
    (e.studentName || '').toLowerCase().includes(q) ||
    (e.category || '').toLowerCase().includes(q) ||
    (e.school || '').toLowerCase().includes(q)) : archive;
  return sortByDate(filtered, dir);
}

// ── بناء السجلات ──
// form: { name, massar, date, school, level, categories[], actions, priority, status, notes, nextFollowup }
// ctx:  { now: Date, profile, institution }
export function buildEntry(form, ctx) {
  const name = String(form.name || '').trim();
  const date = String(form.date || '').trim();
  const category = orderedCategories(form.categories || []).join(' | ');
  const actions = String(form.actions || '').trim();
  if (!name) return { error: MSG.NAME };
  if (!date) return { error: MSG.DATE };
  if (!category) return { error: MSG.CATEGORY };
  if (!actions) return { error: MSG.ACTIONS };
  const now = ctx.now || new Date();
  const p = ctx.profile || null;
  const levelVal = String(form.level || '').trim();
  return {
    entry: {
      id: now.getTime(),
      savedAt: now.toLocaleString('ar-MA'),
      studentName: name,
      massar: String(form.massar || '').trim() || '—',
      date,
      school: String(form.school || '').trim() || (p && p.institution ? p.institution : (p && p.school ? p.school : (ctx.institution || ''))),
      level: levelVal || '—',
      category,
      actions,
      priority: form.priority || 'متوسطة',
      status: form.status || 'قيد المتابعة',
      notes: String(form.notes || '').trim(),
      nextFollowup: String(form.nextFollowup || '').trim() || '—',
      trackingLogs: [],
    },
  };
}

// سجل → قيم نافذة التعديل (الحقل '—' يظهر فارغاً)
export function formFromEntry(e) {
  const dash = (v) => (v !== '—' ? (v || '') : '');
  return {
    name: e.studentName || '',
    massar: dash(e.massar),
    date: dash(e.date),
    school: dash(e.school),
    level: dash(e.level),
    actions: dash(e.actions),
    notes: e.notes || '',
    nextFollowup: dash(e.nextFollowup),
    categories: (e.category || '').split(' | ').map((s) => s.trim()),
    priority: e.priority,
    status: e.status,
  };
}

// حفظ التعديل؛ يرجع { error } أو { archive } (null إن لم يوجد السجل)
export function applyEdit(archive, id, form) {
  const name = String(form.name || '').trim();
  if (!name) return { error: MSG.EDIT_NAME };
  const idx = archive.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  const cats = orderedCategories(form.categories || []);
  const next = archive.slice();
  next[idx] = {
    ...archive[idx],
    studentName: name,
    massar: String(form.massar || '').trim() || '—',
    date: String(form.date || '').trim() || '—',
    school: String(form.school || '').trim() || '—',
    level: String(form.level || '').trim() || '—',
    category: cats.length ? cats.join(' | ') : 'أخرى',
    actions: String(form.actions || '').trim() || '—',
    priority: form.priority || 'متوسطة',
    status: form.status || 'قيد المتابعة',
    notes: String(form.notes || '').trim(),
    nextFollowup: String(form.nextFollowup || '').trim() || '—',
  };
  return { archive: next };
}

export const removeIds = (archive, ids) => archive.filter((e) => !ids.includes(e.id));

// ── الاستيراد من Excel/CSV ──
const NAME_KEYS = ['اسم التلميذ(ة)', 'اسم التلميذ', 'الاسم والنسب', 'الاسم', 'اسم', 'الاسم الكامل', 'اسم المتعلم', 'اسم المتعلم(ة)'];
const KEYS = {
  level: ['القسم', 'الفصل', 'الشعبة', 'المستوى', 'المستوى الدراسي', 'الفصل الدراسي'],
  category: ['نوع الوضعية الحرجة', 'نوع الوضعية', 'الوضعية الحرجة', 'الوضعية', 'نوع الحالة', 'المواكبة النفسية والاجتماعية', 'نوع المشكل', 'طبيعة الوضعية'],
  actions: ['الإجراءات المتخذة', 'الاجراءات المتخذة', 'الإجراءات', 'الاجراءات', 'نوع الاجراء', 'نوع الإجراء', 'الاجراء', 'الإجراء', 'الإجراء المتخذ', 'الإجراءات والدعم', 'الدعم المقدم'],
  date: ['تاريخ المقابلة', 'التاريخ', 'تاريخ', 'تاريخ التدخل', 'تاريخ الرصد'],
  school: ['المؤسسة', 'المدرسة', 'الثانوية', 'الابتدائية', 'اسم المؤسسة', 'المؤسسة التعليمية'],
  priority: ['درجة الأولوية', 'الأولوية', 'الاولوية', 'مستوى الأولوية'],
  status: ['الحالة الراهنة', 'الحالة', 'حالة', 'وضع المتابعة', 'حالة المتابعة'],
  notes: ['ملاحظات', 'ملاحظات إضافية', 'ملاحظات اضافية', 'تعليقات', 'معطيات إضافية'],
  nextFollowup: ['المتابعة القادمة', 'تاريخ المتابعة القادمة', 'المتابعة', 'تاريخ المتابعة', 'الموعد القادم'],
  massar: ['مسار', 'رمز مسار', 'الرقم الوطني', 'رقم مسار', 'المعرف الوطني'],
};

// rows: مصفوفة صفوف (sheet_to_json بـ header:1). يرجع { error } أو { entries (بترتيب الملف), imported }
export function parseImportRows(rows, { nowMs, savedAt, batchId }) {
  if (rows.length < 2) return { error: MSG.IMPORT_EMPTY };

  // كشف ملفات CSV التي فُقدت فيها الأحرف العربية (مستبدلة بـ ?)
  const flatText = rows.slice(0, 10).flat().join('');
  const qCount = (flatText.match(/\?/g) || []).length;
  const alphaCount = (flatText.match(/[a-zA-Z\u0600-\u06FF]/g) || []).length;
  if (qCount > 5 && qCount > alphaCount) return { error: MSG.IMPORT_BAD_CSV };

  // البحث التلقائي عن صف الرأس في أول 30 صف
  let headerRowIdx = -1;
  let nameCol = -1;
  const col = {};
  for (let r = 0; r < Math.min(30, rows.length); r++) {
    const hdr = rows[r].map((h) => String(h || '').trim());
    const ni = hdr.findIndex((h) => NAME_KEYS.includes(h));
    if (ni !== -1) {
      headerRowIdx = r;
      nameCol = ni;
      for (const k of Object.keys(KEYS)) col[k] = hdr.findIndex((h) => KEYS[k].includes(h));
      break;
    }
  }
  if (headerRowIdx === -1) return { error: MSG.IMPORT_NO_NAME };

  const entries = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const cell = (k, dflt) => (col[k] !== -1 ? String(row[col[k]] || '').trim() : dflt);
    const nameVal = String(row[nameCol] || '').trim();
    if (!nameVal || nameVal.length < 2) continue;
    entries.push({
      id: nowMs + i,
      savedAt,
      _importBatch: batchId,
      studentName: nameVal,
      massar: cell('massar', '—'),
      date: cell('date', '—'),
      school: cell('school', '—'),
      level: cell('level', '—'),
      category: cell('category', 'أخرى') || 'أخرى',
      actions: cell('actions', '—'),
      priority: cell('priority', 'متوسطة') || 'متوسطة',
      status: cell('status', 'قيد المتابعة') || 'قيد المتابعة',
      notes: cell('notes', ''),
      nextFollowup: cell('nextFollowup', '—'),
      trackingLogs: [],
    });
  }
  return { entries, imported: entries.length };
}

// القديم يضيف كل سجل بـ unshift، فيصير آخر صف في الملف أول الأرشيف
export const mergeImport = (archive, entries) => [...entries.slice().reverse(), ...archive];

// ── ملفا Excel: النموذج الفارغ والتصدير ──
export const TEMPLATE_ROWS = [
  ['اسم التلميذ(ة)', 'تاريخ المقابلة', 'المؤسسة', 'المستوى', 'نوع الوضعية الحرجة', 'الإجراءات المتخذة', 'درجة الأولوية', 'الحالة الراهنة', 'ملاحظات', 'المتابعة القادمة'],
  ['مثال: محمد الحسن', '2026-04-28', 'ابتدائية النور', 'السادسة ابتدائي', 'عنف مدرسي', 'جلسة استماع + تواصل مع الأسرة + إحالة', 'عاجلة', 'قيد المتابعة', '', '2026-05-05'],
];
export const TEMPLATE_COLS = [25, 15, 20, 20, 25, 40, 15, 20, 25, 15];
export const TEMPLATE_FILE = 'نموذج_خلية_اليقظة.xlsx';
export const SHEET_NAME = 'خلية اليقظة';

export const EXPORT_COLS = [5, 25, 15, 20, 20, 25, 45, 12, 18, 30, 15, 22];
export function exportRows(archive) {
  const rows = [['#', 'اسم التلميذ(ة)', 'تاريخ المقابلة', 'المؤسسة', 'المستوى', 'نوع الوضعية الحرجة', 'الإجراءات المتخذة', 'الأولوية', 'الحالة الراهنة', 'ملاحظات', 'المتابعة القادمة', 'تاريخ الحفظ']];
  archive.forEach((e, i) => rows.push([
    i + 1, e.studentName, e.date, e.school, e.level, e.category,
    e.actions, e.priority, e.status, e.notes, e.nextFollowup, e.savedAt,
  ]));
  return rows;
}
export const exportFileName = (now = new Date()) => `خلية_اليقظة_${now.toLocaleDateString('ar-MA').replace(/\//g, '-')}.xlsx`;

// ── التقارير ──
// بنية موحّدة للطباعة وWord، بنفس ترويسة بقية البوابات: الشعار بعرض الورقة ← المديرية ← المؤسسة ← عنوان التقرير

// المؤسسة في التقرير الشامل: school من الملف الشخصي ثم حقل النموذج ثم اسم المؤسسة
export const reportSchool = ({ profile, formSchool, institution }) =>
  String((profile && profile.school) || formSchool || institution || '').trim() || 'المؤسسة التعليمية';

// المؤسسة في بطاقة الحالة: مؤسسة السجل ثم school من الملف الشخصي ثم حقل النموذج ثم اسم المؤسسة
export const caseSchool = (e, { profile, formSchool, institution }) =>
  String((e.school && e.school !== '—') ? e.school
    : (profile && profile.school) ? profile.school
      : (formSchool || institution || '')).trim() || 'المؤسسة التعليمية';

const specialistOf = (profile) => (profile && profile.fullName ? profile.fullName : '—');

export function reportHtml(archive, { school, profile, logo = '', forWord = false }) {
  if (!archive.length) return '';
  const specialist = specialistOf(profile);
  const k = kpis(archive);
  const total = k.total;

  const cats = {};
  archive.forEach((e) => { const c = e.category || '—'; cats[c] = (cats[c] || 0) + 1; });
  const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `<tr><td>${vigEsc(c)}</td><td>${n}</td><td>${Math.round(n / total * 100)}%</td></tr>`).join('');

  // في Word تُدمج أسطر الإجراءات بفاصل واضح (الخلية تُقرأ كنص)، وفي الطباعة تبقى أسطرًا
  const actionsCell = (e) => {
    const lines = String(e.actions || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
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
    </tr></thead><tbody><tr><td>${total}</td><td>${k.urgent}</td><td>${k.inProgress}</td><td>${k.resolved}</td></tr></tbody></table>

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

export function caseHtml(e, { school, profile, logo = '' }) {
  const specialist = specialistOf(profile);
  const v = (x) => vigEsc(x && x !== '—' ? x : '—');
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

export const caseFileName = (e, isoDate) =>
  'بطاقة_اليقظة_' + String(e.studentName || 'تلميذ').replace(/[\\/:*?"<>|\s]+/g, '_') + '_' + isoDate;

// ── أنماط الطباعة (منقولة حرفياً) ──
export function caseStyles(scope) {
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

// بطاقة الحالة: A4 عمودي
export const CASE_PRINT_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; color: #000; padding: 0 12mm;
           -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    table.pg { width: 100%; border-collapse: collapse; }
    table.pg > thead > tr > td, table.pg > tfoot > tr > td { padding: 0; border: 0; height: 10mm; }
    table.pg > tbody > tr > td { padding: 0; border: 0; }` + caseStyles('');

// التقرير الشامل: A4 أفقي
export const REPORT_PRINT_CSS = `
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

// المستند الذي يُكتب في إطار الطباعة (جدول بترويسة وتذييل فارغين يحجزان هامشاً في كل صفحة)
export const buildPrintDocument = (css, bodyHtml) =>
  '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title> </title><style>' + css + '</style></head><body>' +
  '<table class="pg"><thead><tr><td></td></tr></thead><tbody><tr><td>' + bodyHtml + '</td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>';
