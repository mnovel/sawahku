import PocketBase from 'pocketbase';

// Cukup gunakan window.location.origin (localhost:5173).
// Vite akan otomatis meneruskan request '/api' ke Pi (192.168.100.205:8090)
export const pb = new PocketBase(window.location.origin);

pb.autoCancellation(false);