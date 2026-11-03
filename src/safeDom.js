// حماية من انهيار React (الشاشة البيضاء) حين يغيّر الكود القديم عناصر DOM التي ترسم فيها البوابات.
// الخطأ: NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
// الفكرة: إن طُلب حذف أو إدراج عنصر بالنسبة لأب لم يعد يحتويه، نتجاهل العملية ونكمل بدل رمي الخطأ.
// يُستورد مرة واحدة في أول main.jsx قبل أي رسم.

if (typeof Node === 'function' && Node.prototype && !Node.prototype.__spesocialSafeDom) {
  const origRemove = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      if (typeof console !== 'undefined') console.warn('[safeDom] تجاهل removeChild لعنصر لم يعد تابعًا لأبيه', child, this);
      return child;
    }
    return origRemove.apply(this, arguments);
  };

  const origInsert = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, refNode) {
    if (refNode && refNode.parentNode !== this) {
      if (typeof console !== 'undefined') console.warn('[safeDom] تجاهل insertBefore لعنصر مرجعي لم يعد تابعًا لأبيه', refNode, this);
      return newNode;
    }
    return origInsert.apply(this, arguments);
  };

  Node.prototype.__spesocialSafeDom = true;
}
