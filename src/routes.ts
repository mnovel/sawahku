export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  NOTA_DETAIL: (id: string) => `/nota/${id}`,
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    SAWAH: "/admin/sawah",
    PENYEWA: "/admin/penyewa",
    TRANSAKSI: (params?: { q?: string; penyewa?: string; bayar?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.append("q", params.q);
      if (params?.penyewa) searchParams.append("penyewa", params.penyewa);
      if (params?.bayar) searchParams.append("bayar", params.bayar);
      const queryStr = searchParams.toString();
      return queryStr ? `/admin/transaksi?${queryStr}` : "/admin/transaksi";
    },
    LAPORAN: "/admin/laporan",
    SETTING: "/admin/setting",
  },
};