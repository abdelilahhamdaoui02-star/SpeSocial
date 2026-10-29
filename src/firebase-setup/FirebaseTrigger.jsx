import { statusView } from './firebaseSetupLogic.js';
import { getSession } from '../session/installSession.js';
import { useFirebaseStatus } from './useFirebaseStatus.js';

// زر «إعداد Firebase» في شاشة الدخول: صار يتبع الحالة بنفسه بدل أن يكتب فيه الكود القديم
export default function FirebaseTrigger() {
  const v = statusView(useFirebaseStatus());
  return (
    <button
      type="button"
      className="fb-setup-trigger"
      id="fbSetupTrigger"
      onClick={() => getSession().panels.openFirebaseSetup()}
    >
      <span className="fb-dot" id="fbTriggerDot" style={{ background: v.dot }}></span>
      <span id="fbTriggerText">{v.trigger}</span>
    </button>
  );
}
