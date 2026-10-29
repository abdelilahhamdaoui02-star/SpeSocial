// مجمَّد قبل الخطوة 42: openProfile/closeProfile من script-10.js ثم تغليف الهاتف من script-39.js — مرجع اختبار المطابقة فقط
function openProfile() {
  window.dispatchEvent(new Event('legacy:profile-open'));
  const m = document.getElementById('profileModal');
  m.classList.add('open');
  m.scrollTop = 0;
}

function closeProfile() {
  document.getElementById('profileModal').classList.remove('open');
  window.dispatchEvent(new Event('legacy:profile-close'));
}


(function(){
  var mq = window.matchMedia('(max-width:820px)');

  // زر «رجوع» صار يُرسم داخل ترويسة الحساب في React (src/profile)

  var _open  = window.openProfile;
  var _close = window.closeProfile;

  window.openProfile = function(){
    _open.apply(this, arguments);
    if(mq.matches){
      document.documentElement.classList.add('pf-lock');
      try{ history.pushState({pf:1}, ''); }catch(e){}   // زر الرجوع في الهاتف يغلق الصفحة
    }
  };

  window.closeProfile = function(){
    if(mq.matches && history.state && history.state.pf){ history.back(); return; }
    _close.apply(this, arguments);
    document.documentElement.classList.remove('pf-lock');
  };

  window.addEventListener('popstate', function(){
    var m = document.getElementById('profileModal');
    if(m && m.classList.contains('open')){
      _close();
      document.documentElement.classList.remove('pf-lock');
    }
  });
})();
