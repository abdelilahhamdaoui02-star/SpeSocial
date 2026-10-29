var __origDocTitle = null;
window.addEventListener('beforeprint', function () {
  if (document.querySelector('#interviewPrintModal.open, #snPrintModal.open, #reintegrationPrintModal.open, #absencePrintModal.open, #vioPrintModal.open, #wsPrintModal.open, #pdPrintModal.open, #pgPrintModal.open')) {
    document.documentElement.classList.add('i-print-mode');
    if (__origDocTitle === null) __origDocTitle = document.title;
    document.title = ' ';
  }
});
window.addEventListener('afterprint', function () {
  document.documentElement.classList.remove('i-print-mode');
  if (__origDocTitle !== null) { document.title = __origDocTitle; __origDocTitle = null; }
});

