import { useState, useEffect } from 'react';

export default function MobileSidebarToggle() {
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const check = () => {
      setSidebarHidden(sidebar.classList.contains('mobile-collapsed'));
    };

    const observer = new MutationObserver(check);
    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    check();

    return () => observer.disconnect();
  }, []);

  if (!sidebarHidden) return null;

  return (
    <button
      className="mobile-sidebar-toggle"
      onClick={() => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('mobile-collapsed');
      }}
      title="显示侧边栏"
      aria-label="显示侧边栏"
    >
      <span aria-hidden="true">☰</span>
    </button>
  );
}
