// قائمة البوابات الظاهرة في الصفحة الرئيسية — مصدر واحد بدل HTML مكرَّر.
// منقولة حرفياً من body.html القديم (الترتيب والألوان والأيقونات والتسميات الافتراضية).
// icon: كود SVG أو إيموجي ثابت من عندنا (ليس إدخال مستخدم).
// label: أسطر التسمية الافتراضية؛ يمكن للأدمين تغييرها من site_config (gates).
export const PORTALS = [
  {
    "id": "interview",
    "group": "others",
    "color": "c-blue",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/><path d=\"M8 9h8M8 13h5\"/></svg>",
    "label": [
      "المقابلات الفردية"
    ]
  },
  {
    "id": "violence",
    "group": "others",
    "color": "c-coral",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z\"/></svg>",
    "label": [
      "حالات العنف"
    ]
  },
  {
    "id": "specialneeds",
    "group": "others",
    "color": "c-indigo",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"4.5\" r=\"2\"/><path d=\"M5 8.5l7 1.5 7-1.5M12 10v5l-3 6M12 15l3 6\"/></svg>",
    "label": [
      "وضعية الإعاقة"
    ]
  },
  {
    "id": "reintegration",
    "group": "others",
    "color": "c-teal",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M22 10L12 5 2 10l10 5 10-5z\"/><path d=\"M6 12v5c3 2.5 9 2.5 12 0v-5\"/></svg>",
    "label": [
      "الإدماج المدرسي"
    ]
  },
  {
    "id": "vigilance",
    "group": "others",
    "color": "c-amber",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9\"/><path d=\"M13.7 21a2 2 0 0 1-3.4 0\"/></svg>",
    "label": [
      "خلية اليقظة"
    ]
  },
  {
    "id": "behavior",
    "group": "others",
    "color": "c-teal",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M9 4h6v3H9z\"/><path d=\"M7 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2\"/><path d=\"M8 14l3 3 5-6\"/></svg>",
    "label": [
      "رصد السلوك"
    ]
  },
  {
    "id": "parents",
    "group": "others",
    "color": "c-teal",
    "icon": "📞",
    "label": [
      "التواصل مع الأولياء"
    ]
  },
  {
    "id": "casefile",
    "group": "portals",
    "color": "c-blue",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/></svg>",
    "label": [
      "ملف الحالة الشامل"
    ]
  },
  {
    "id": "absence",
    "group": "portals",
    "color": "c-amber",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 20V11M12 20V4M19 20v-6M3 20h18\"/></svg>",
    "label": [
      "التلاميذ",
      "الأكثر غياباً"
    ]
  },
  {
    "id": "iip",
    "group": "portals",
    "color": "c-teal",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 21s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z\"/><path d=\"M8 12h2l1.5-2.5L13 14l1-2h2\"/></svg>",
    "label": [
      "البرنامج التدخلي",
      "الفردي"
    ]
  },
  {
    "id": "printdocs",
    "group": "portals",
    "color": "c-indigo",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M7 9V3h10v6\"/><rect x=\"3\" y=\"9\" width=\"18\" height=\"8\" rx=\"2\"/><path d=\"M7 14h10v7H7z\"/></svg>",
    "label": [
      "بوابة الإحالة",
      "والإخبار الصحي"
    ]
  },
  {
    "id": "stats",
    "group": "portals",
    "color": "c-teal",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"4.5\" width=\"18\" height=\"16.5\" rx=\"3\"/><path d=\"M8 2.5v4M16 2.5v4M3 10h18M8 14h2M14 14h2M8 17.5h2M14 17.5h2\"/></svg>",
    "label": [
      "الإحصاء البياني"
    ]
  },
  {
    "id": "workshops",
    "group": "portals",
    "color": "c-blue",
    "icon": "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1.4\"/></svg>",
    "label": [
      "الورشات والأنشطة"
    ]
  },
  {
    "id": "followup",
    "group": "portals",
    "color": "c-amber",
    "icon": "🔔",
    "label": [
      "المتابعة"
    ]
  }
];
