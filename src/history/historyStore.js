// حالة نافذة «سجل التلميذ» وجسر أفعال التعديل/الحذف — بديل متغيرات _currentHistory* وwindow.iLoadEntry/deleteFromArchive/rLoadEntry/deleteREntry.
// بوابتا المقابلات والإدماج تسجّلان فعليهما هنا عند التركيب، والنافذة تستدعيهما بدل أن تبني onclick نصياً.
export function createHistoryStore() {
  let state = { open: false, type: 'interview', name: '', currentId: null };
  const listeners = new Set();
  const actions = {};
  const set = (next) => { state = next; listeners.forEach((fn) => fn()); };

  return {
    getSnapshot: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    open: (type, name, currentId = null) => set({ open: true, type, name, currentId }),
    close: () => set({ ...state, open: false }),
    // { loadEntry(id), del(id, skipConfirm) } لنوع واحد؛ تعيد دالة لإلغاء التسجيل
    register(type, api) {
      actions[type] = api;
      return () => { if (actions[type] === api) delete actions[type]; };
    },
    // يستدعي فعل البوابة إن كانت مركَّبة، وإلا لا يفعل شيئاً
    run(type, action, ...args) {
      const api = actions[type];
      return api && typeof api[action] === 'function' ? api[action](...args) : undefined;
    },
  };
}
