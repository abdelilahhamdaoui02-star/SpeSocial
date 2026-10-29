import { createHistoryStore } from './historyStore.js';

export const historyStore = createHistoryStore();

// تُستدعى من زر «📋 السجل» في بوابتي المقابلات (interview) والإدماج (reintegration)
export const openStudentHistory = (name, currentId) => historyStore.open('interview', name, currentId);
export const openReintegrationHistory = (name, currentId) => historyStore.open('reintegration', name, currentId);
export const registerHistoryActions = (type, api) => historyStore.register(type, api);
