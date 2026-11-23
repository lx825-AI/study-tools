import useOnlineStatus from '../hooks/useOnlineStatus';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: 8,
        textAlign: 'center',
        fontSize: 13,
        zIndex: 9999,
        background: '#f59e0b',
        color: '#fff',
      }}
    >
      当前处于离线状态，部分功能可能受限
    </div>
  );
}
