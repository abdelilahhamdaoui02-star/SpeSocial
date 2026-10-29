import { useEffect, useState } from 'react';
import { getCloudStatus } from '../services/cloud.js';

// حالة Firebase الحالية: تُقرأ عند التركيب ثم تتحدّث من حدث legacy:sync-status (يرسله fbUpdateStatus القديم)
export function useFirebaseStatus() {
  const read = () => getCloudStatus() || 'not_configured';
  const [status, setStatus] = useState(read);
  useEffect(() => {
    const onSync = (e) => {
      const s = e.detail && e.detail.status;
      setStatus(s || read());
    };
    window.addEventListener('legacy:sync-status', onSync);
    setStatus(read());
    return () => window.removeEventListener('legacy:sync-status', onSync);
  }, []);
  return status;
}
