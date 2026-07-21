import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import 'katex/dist/katex.min.css';
import './styles/variables.css';
import './styles/global.css';

// 注册 Service Worker
if ('serviceWorker' in navigator && !location.protocol.startsWith('file')) {
  navigator.serviceWorker.register('./sw.js', { scope: './' })
    .catch(() => { /* 静默失败 */ });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
