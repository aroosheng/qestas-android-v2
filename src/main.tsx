
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App.tsx';
import './index.css';

StatusBar.setOverlaysWebView({ overlay: false }).catch(console.error);
StatusBar.setStyle({ style: Style.Light }).catch(console.error);
StatusBar.setBackgroundColor({ color: '#0f172a' }).catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
