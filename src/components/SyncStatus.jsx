import { useEffect, useState } from 'react';
import { SYNC_STATUS, onSyncStatusChange } from '../lib/tencentSync';

export default function SyncStatus() {
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.OFFLINE);

  useEffect(() => {
    const unsubscribe = onSyncStatusChange(setSyncStatus);
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const getStatusInfo = () => {
    switch (syncStatus) {
      case SYNC_STATUS.SYNCED:
        return {
          icon: '✓',
          text: 'Synced',
          color: '#10b981', // green
        };
      case SYNC_STATUS.SYNCING:
        return {
          icon: '⟳',
          text: 'Syncing...',
          color: '#f59e0b', // amber
        };
      case SYNC_STATUS.OFFLINE:
        return {
          icon: '⊗',
          text: 'Offline mode',
          color: '#6b7280', // gray
        };
      case SYNC_STATUS.ERROR:
        return {
          icon: '!',
          text: 'Sync error',
          color: '#ef4444', // red
        };
      default:
        return {
          icon: '?',
          text: 'Unknown',
          color: '#6b7280',
        };
    }
  };

  const info = getStatusInfo();

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${info.color}20`,
        color: info.color,
        border: `1px solid ${info.color}40`,
      }}
    >
      <span
        className={syncStatus === SYNC_STATUS.SYNCING ? 'inline-block animate-spin' : ''}
        style={{ display: 'inline-block' }}
      >
        {info.icon}
      </span>
      <span>{info.text}</span>
    </div>
  );
}
