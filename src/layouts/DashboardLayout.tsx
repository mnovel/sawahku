import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../routes";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Sprout,
  Users,
  LogOut,
  ClipboardList,
  FileText,
  X,
  Menu,
  Settings,
} from "lucide-react";
import useSetting from "../hooks/useSetting";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { setting } = useSetting();

  // Menggunakan konstanta ROUTES yang terpusat agar konsisten
  const menu = [
    {
      name: "Dashboard",
      path: ROUTES.ADMIN.DASHBOARD,
      icon: <LayoutDashboard size={20} />,
    },
    { name: "Data Sawah", path: ROUTES.ADMIN.SAWAH, icon: <Sprout size={20} /> },
    { name: "Data Penyewa", path: ROUTES.ADMIN.PENYEWA, icon: <Users size={20} /> },
    {
      name: "Transaksi Sewa",
      path: ROUTES.ADMIN.TRANSAKSI(),
      icon: <ClipboardList size={20} />,
    },
    { name: "Laporan", path: ROUTES.ADMIN.LAPORAN, icon: <FileText size={20} /> },
    { name: "Pengaturan", path: ROUTES.ADMIN.SETTING, icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex justify-between items-center text-xl font-bold text-white border-b border-slate-800">
          <div className="flex items-center gap-3 truncate">
            <img
              src="/favicon.svg"
              alt="Logo Sawahku"
              className="w-9 h-9 rounded-xl shadow-md shrink-0 bg-slate-800 p-1 object-contain"
            />
            <span className="tracking-wide uppercase font-black text-emerald-400 truncate">
              {setting?.nama_aplikasi || "SAWAHKU"}
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span
                  className={isActive ? "text-emerald-400" : "text-slate-400"}
                >
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl transition-colors text-sm font-medium cursor-pointer"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="bg-white shadow-sm border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {location.pathname.replace("/admin/", "").replace("/", " ") || "Dashboard"}
            </h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}