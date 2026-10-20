import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import useSetting from "../hooks/useSetting";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ROUTES } from "../routes";
import { Lock, Mail, ArrowLeft, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const { setting } = useSetting();
  const navigate = useNavigate();

  // Redirect otomatis ke dashboard jika sesi login sudah aktif
  useEffect(() => {
    if (user) {
      navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Login gagal. Periksa kembali email dan password Anda.");
    } finally {
      setLoading(false);
    }
  };

  // Pengaturan Title & Meta dinamis dari Database dengan Fallback aman
  const pageTitle = setting?.nama_aplikasi
    ? `Login Administrator - ${setting.nama_aplikasi}`
    : "Login Administrator - Sawahku";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4 relative font-sans selection:bg-emerald-500 selection:text-white">
      {/* PENGATURAN META / HELMET */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="Halaman masuk khusus administrator dan pengelola sistem manajemen lahan sawah."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 p-8 space-y-6">
        {/* Header Logo & Judul */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200 shadow-md shadow-emerald-500/10 mx-auto p-2.5">
            <img
              src="/favicon.svg"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {setting?.nama_aplikasi || "SAWAHKU"}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {setting?.deskripsi_singkat ||
              "Silakan masuk menggunakan akun pengelola/admin yang terdaftar."}
          </p>
        </div>

        {/* Kotak Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold p-3.5 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-3.5 text-slate-400"
                size={18}
              />
              <input
                type="email"
                required
                placeholder="admin@sawahku.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-3.5 text-slate-400"
                size={18}
              />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 text-sm mt-2 inline-flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            {loading ? "Memproses..." : "Masuk ke Dashboard"}
          </button>
        </form>

        {/* Tautan Kembali ke Beranda di Bawah */}
        <div className="text-center pt-2">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft size={14} /> Kembali ke Beranda Utama
          </Link>
        </div>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Akses terbatas khusus pengelola sistem{" "}
            <span className="font-semibold text-slate-600">
              {setting?.nama_aplikasi || "Sawahku"}
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
