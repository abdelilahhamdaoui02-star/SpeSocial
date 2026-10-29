// مجمَّد من script-10.js قبل المرحلة 34 (الميزاجور)
function renderSiteNotice() {
  const box = document.getElementById('siteNotice'); if (!box) return;
  const n = (SITE_CFG && SITE_CFG.notice) || {};
  let dis = ''; try { dis = localStorage.getItem('site:notice:dismissed') || ''; } catch (e) {}
  if (!n.on || !(n.text || n.title) || dis === n.id) { box.style.display = 'none'; return; }
  box.className = 'site-notice lv-' + (n.level || 'info'); box.style.display = 'flex';
  box.innerHTML = '<div class="sn-ico">📢</div><div class="sn-body"><b></b><p></p><small></small></div><button type="button" aria-label="إغلاق">✕</button>';
  box.querySelector('b').textContent = n.title || 'ميزاجور';
  box.querySelector('p').textContent = n.text || '';
  box.querySelector('small').textContent = n.date || '';
  box.querySelector('button').onclick = () => { try { localStorage.setItem('site:notice:dismissed', n.id); } catch (e) {} box.style.display = 'none'; };
}
