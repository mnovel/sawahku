import { Link } from "react-router-dom";
import { ROUTES } from "../routes";
import { Sprout, Home, ArrowLeft } from "lucide-react";
import useSetting from "../hooks/useSetting";

export default function NotFound() {
  const { setting } = useSetting();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-6 text-white font-sans selection:bg-emerald-500 selection:text-white">
      <div className="max-w-md w-full text-center space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
        
        {/* Logo Ikon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mx-auto">
          <Sprout size={32} />
        </div>

        {/* Kode Error 404 */}
        <div className="space-y-2">
          <span className="text-emerald-400 text-xs font-black tracking-widest uppercase bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
            Error 404
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2">Halaman Tidak Ditemukan</h1>
          <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
            Maaf, halaman yang Anda tuju atau tautan yang Anda akses tidak tersedia atau telah dipindahkan di portal <strong className="text-white">{setting?.nama_aplikasi || "Sawahku"}</strong>.
          </p>
        </div>

        {/* Tombol Navigasi */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Home size={16} /> Ke Beranda Utama
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>

      </div>
    </div>
  );
}