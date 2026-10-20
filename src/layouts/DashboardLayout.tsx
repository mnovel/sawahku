import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ROUTES } from "../routes";
import { useAuth } from "../contexts/AuthContext";
import { pb } from "../lib/pb"; // <-- 1. IMPORT PB
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import useSetting from "../hooks/useSetting";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const { setting } = useSetting();

  // 2. BUAT VARIABEL LOGO URL (Fallback ke /favicon.svg jika kosong)
  const logoUrl = setting?.logo
    ? pb.files.getURL(setting as any, setting.logo)
    : "/favicon.svg";

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 768 && width < 1150) {
        setIsDesktopCollapsed(true);
      } else if (width >= 1150) {
        setIsDesktopCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menu = [
    {
      name: "Dashboard",
      path: ROUTES.ADMIN.DASHBOARD,
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: "Data Sawah",
      path: ROUTES.ADMIN.SAWAH,
      icon: <Sprout size={20} />,
    },
    {
      name: "Data Penyewa",
      path: ROUTES.ADMIN.PENYEWA,
      icon: <Users size={20} />,
    },
    {
      name: "Transaksi Sewa",
      path: ROUTES.ADMIN.TRANSAKSI(),
      icon: <ClipboardList size={20} />,
    },
    {
      name: "Laporan",
      path: ROUTES.ADMIN.LAPORAN,
      icon: <FileText size={20} />,
    },
    {
      name: "Pengaturan",
      path: ROUTES.ADMIN.SETTING,
      icon: <Settings size={20} />,
    },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    let currentMenuName = "Dashboard";

    if (path.includes("sawah")) currentMenuName = "Data Sawah";
    else if (path.includes("penyewa")) currentMenuName = "Data Penyewa";
    else if (path.includes("transaksi")) currentMenuName = "Transaksi Sewa";
    else if (path.includes("laporan")) currentMenuName = "Laporan Keuangan";
    else if (path.includes("setting")) currentMenuName = "Pengaturan Aplikasi";

    const appName = setting?.nama_aplikasi || "Sawahku";
    return `${currentMenuName} - Admin ${appName}`;
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Helmet>
        <title>{getPageTitle()}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* OVERLAY MOBILE */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out md:static ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isDesktopCollapsed ? "md:w-20" : "md:w-64"} w-64`}
      >
        {/* Header Sidebar */}
        <div className="p-4 md:p-6 flex justify-between items-center text-xl font-bold text-white border-b border-slate-800">
          <div
            className={`flex items-center gap-3 truncate ${isDesktopCollapsed ? "md:hidden" : ""}`}
          >
            <img
              src={logoUrl} // <-- 3. GUNAKAN logoUrl DI SINI
              alt="Logo Sawahku"
              className="w-9 h-9 rounded-xl shadow-md shrink-0 bg-slate-800 p-1 object-contain"
            />
            <span className="tracking-wide uppercase font-black text-emerald-400 truncate">
              {setting?.nama_aplikasi || "SAWAHKU"}
            </span>
          </div>

          {/* Logo kecil saat di-minimize */}
          {isDesktopCollapsed && (
            <div className="hidden md:flex justify-center w-full">
              <img
                src={logoUrl} // <-- 4. GUNAKAN logoUrl DI SINI JUGA
                alt="Logo"
                className="w-8 h-8 rounded-lg bg-slate-800 p-1 object-contain"
              />
            </div>
          )}

          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                title={isDesktopCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span
                  className={`${isActive ? "text-emerald-400" : "text-slate-400"} shrink-0`}
                >
                  {item.icon}
                </span>
                <span
                  className={`truncate ${isDesktopCollapsed ? "md:hidden" : ""}`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar (User & Logout) */}
        <div className="p-3 border-t border-slate-800">
          <div
            className={`flex items-center gap-3 mb-3 px-2 ${isDesktopCollapsed ? "md:justify-center" : ""}`}
          >
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div
              className={`flex-1 min-w-0 ${isDesktopCollapsed ? "md:hidden" : ""}`}
            >
              <p className="text-xs font-medium text-white truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title={isDesktopCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-600 text-white py-2.5 rounded-xl transition-colors text-xs font-medium cursor-pointer ${
              isDesktopCollapsed ? "md:px-0" : "px-4"
            }`}
          >
            <LogOut size={16} className="shrink-0" />
            <span className={`${isDesktopCollapsed ? "md:hidden" : ""}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="bg-white shadow-sm border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Tombol Menu untuk Mobile */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <Menu size={24} />
            </button>

            {/* Tombol Collapse / Minimize untuk Desktop/Tab */}
            <button
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
              className="hidden md:flex p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title={isDesktopCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
            >
              {isDesktopCollapsed ? (
                <PanelLeftOpen size={22} />
              ) : (
                <PanelLeftClose size={22} />
              )}
            </button>

            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {location.pathname.replace("/admin/", "").replace("/", " ") ||
                "Dashboard"}
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
