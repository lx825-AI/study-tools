import { useState, useEffect } from 'react';
import '../styles/responsive.css';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <button
      className={`back-to-top${visible ? ' visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title="回到顶部"
      aria-label="回到顶部"
    >
      <span aria-hidden="true">⬆</span>
    </button>
  );
}
