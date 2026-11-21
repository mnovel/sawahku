import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'

// Daftarkan service worker PWA hanya pada build produksi agar mode dev tidak
// menyajikan aset dari cache.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Nama bundle ber-hash dipakai sebagai versi URL & nama cache agar tiap
    // deploy memakai SW/cache baru (menghindari cache CDN yang basi).
    const buildId =
      document
        .querySelector<HTMLScriptElement>('script[type="module"][src^="/assets/"]')
        ?.src.split('/')
        .pop() ?? ''

    navigator.serviceWorker
      .register(buildId ? `/sw.js?v=${buildId}` : '/sw.js', { scope: '/' })
      .catch((err) => {
        console.warn('Service worker gagal didaftarkan:', err)
      })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)