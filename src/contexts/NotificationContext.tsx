import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// --- TIPE DATA ---
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; message: string; type: ToastType; }
interface ConfirmOptions { 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  isDestructive?: boolean; 
}

interface NotificationContextType {
  toast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmData, setConfirmData] = useState<ConfirmOptions | null>(null);

  // --- FUNGSI TOAST ---
  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    // Hilang otomatis setelah 3 detik
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // --- FUNGSI CONFIRM ---
  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmData(options);
  }, []);

  // Ikon dan warna untuk Toast
  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success': return { icon: <CheckCircle2 className="text-emerald-500" />, bg: 'bg-white border-emerald-200 shadow-emerald-100' };
      case 'error': return { icon: <XCircle className="text-red-500" />, bg: 'bg-white border-red-200 shadow-red-100' };
      case 'warning': return { icon: <AlertTriangle className="text-amber-500" />, bg: 'bg-white border-amber-200 shadow-amber-100' };
      default: return { icon: <Info className="text-blue-500" />, bg: 'bg-white border-blue-200 shadow-blue-100' };
    }
  };

  return (
    <NotificationContext.Provider value={{ toast, confirm }}>
      {children}

      {/* ================= KOMPONEN TOAST (POJOK KANAN ATAS) ================= */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => {
          const style = getToastStyle(t.type);
          return (
            <div key={t.id} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-300 ${style.bg}`}
            >
              {style.icon}
              <p className="text-sm font-medium text-slate-700">{t.message}</p>
              <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="text-slate-400 hover:text-slate-600 ml-2">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ================= KOMPONEN CONFIRM MODAL ================= */}
      {confirmData && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${confirmData.isDestructive ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmData.title}</h3>
              <p className="text-slate-500 text-sm">{confirmData.message}</p>
            </div>
            <div className="flex border-t border-slate-100">
              <button onClick={() => setConfirmData(null)} className="flex-1 py-3.5 text-slate-600 font-medium hover:bg-slate-50 transition-colors border-r border-slate-100">
                Batal
              </button>
              <button 
                onClick={() => { confirmData.onConfirm(); setConfirmData(null); }} 
                className={`flex-1 py-3.5 font-bold transition-colors ${confirmData.isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotify harus dipakai di dalam NotificationProvider');
  return context;
};