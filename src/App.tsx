import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "./routes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import Sawah from "./pages/Sawah";
import Penyewa from "./pages/Penyewa";
import Transaksi from "./pages/Transaksi";
import Laporan from "./pages/Laporan";
import NotaDetail from "./pages/NotaDetail";
import Setting from "./pages/Setting";
import LandingHome from "./pages/LandingHome";
import NotFound from "./pages/NotFound";

function ProtectedRoute() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return <DashboardLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* === RUTE PUBLIK (Bisa diakses tanpa login) === */}
            <Route path={ROUTES.HOME} element={<LandingHome />} />            
            <Route path={ROUTES.NOTA_DETAIL(":id")} element={<NotaDetail />} />      
            <Route path={ROUTES.LOGIN} element={<Login />} />             

            {/* === RUTE ADMIN (Wajib Login) - Menggunakan awalan /admin === */}
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route index element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="sawah" element={<Sawah />} />
              <Route path="penyewa" element={<Penyewa />} />
              <Route path="transaksi" element={<Transaksi />} />
              <Route path="laporan" element={<Laporan />} />
              <Route path="setting" element={<Setting />} />
            </Route>

            {/* === RUTE ERROR 404 (Menangkap semua URL ngawur/salah) === */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}