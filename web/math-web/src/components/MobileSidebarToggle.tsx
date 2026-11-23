interface MobileSidebarToggleProps {
  visible: boolean;
  onOpen: () => void;
}

export default function MobileSidebarToggle({ visible, onOpen }: MobileSidebarToggleProps) {
  if (!visible) return null;

  return (
    <button
      className="mobile-sidebar-toggle"
      onClick={onOpen}
      title="显示侧边栏"
      aria-label="显示侧边栏"
    >
      <span aria-hidden="true">☰</span>
    </button>
  );
}
