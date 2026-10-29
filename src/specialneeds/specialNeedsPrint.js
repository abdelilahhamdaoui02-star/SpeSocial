// الجزء من بوابة الإعاقة الذي يلمس المتصفح مباشرة: تنزيل بطاقة المتابعة كملف.
// منقول من snDownloadTrackingCard وsnDownloadTrackingCardWord القديمتين في script-16.js.

// parts: مصفوفة أجزاء Blob (الـWord يبدأ بعلامة BOM)، type: نوع الملف، fileName: اسم التنزيل
export function downloadBlob(parts, type, fileName) {
  const blob = new Blob(parts, { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const downloadHtml = (html, fileName) => downloadBlob([html], 'text/html;charset=utf-8', fileName);
export const downloadWordDoc = (html, fileName) => downloadBlob(['\ufeff', html], 'application/msword;charset=utf-8', fileName);
