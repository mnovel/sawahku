import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { pb } from "../lib/pb";
import { useNotify } from "../contexts/NotificationContext";
import {
  Sprout,
  Users,
  Activity,
  Banknote,
  ArrowRight,
  Clock,
  Plus,
  FileText,
  AlertTriangle,
  MessageCircle,
  TrendingUp,
  PieChart,
  RotateCw,
  Calendar,
  Image as ImageIcon,
  Hourglass,
  ClipboardList, // <-- Tambahan Ikon
} from "lucide-react";

interface Transaksi {
  id: string;
  tanggal_mulai: string;
  tanggal_jatuh_tempo?: string;
  harga_sewa: number;
  status: string;
  status_bayar: string;
  nominal_dibayar: number;
  expand?: {
    sawah?: { id: string; nama: string; luas_total: number };
    penyewa?: { id: string; nama: string; kontak?: string };
  };
}

interface LogBulanan {
  id: string;
  periode: string;
  fase: string;
  keterangan: string;
  foto?: string;
  expand?: {
    transaksi?: {
      expand?: {
        sawah?: { nama: string };
        penyewa?: { nama: string };
      };
    };
  };
}

interface RiwayatBayar {
  id: string;
  nominal: number;
  tanggal: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatWA = (phone: string) => {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  return cleaned;
};

// Fungsi menghitung total bulan berjalan
const calculateMonthCount = (startDateStr: string) => {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date();

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
  }
  return Math.max(0, months);
};

const calculateDuration = (startDateStr: string) => {
  if (!startDateStr) return "-";
  const start = new Date(startDateStr);
  const end = new Date();

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) return "0 Hari";

  const parts = [];
  if (months > 0) parts.push(`${months} bln`);
  if (days > 0 || parts.length === 0) parts.push(`${days} hr`);

  return parts.join(" ");
};

const getFaseLabel = (fase: string) => {
  switch (fase) {
    case "tanam":
      return { label: "Tanam", bg: "bg-emerald-100 text-emerald-700" };
    case "perawatan":
      return { label: "Perawatan", bg: "bg-blue-100 text-blue-700" };
    case "panen":
      return { label: "Panen", bg: "bg-amber-100 text-amber-700" };
    case "kosong":
      return { label: "Kosong", bg: "bg-slate-100 text-slate-600" };
    default:
      return { label: "Lainnya", bg: "bg-purple-100 text-purple-700" };
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useNotify();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    sawahTotal: 0,
    sawahTersewa: 0,
    penyewaAktif: 0,
    transaksiAktif: 0,
    potensiPendapatan: 0,
    uangMasukBulanIni: 0,
    totalLuasLahan: 0,
  });

  const [activeTrx, setActiveTrx] = useState<Transaksi[]>([]);
  const [overdueTrx, setOverdueTrx] = useState<Transaksi[]>([]);
  const [longTermTrx, setLongTermTrx] = useState<Transaksi[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogBulanan[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const now = new Date();
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // 1. Data Sawah & Okupansi
        let sawahList: any[] = [];
        try {
          sawahList = await pb.collection("sawah").getFullList();
        } catch (e) {
          console.error("Gagal memuat data sawah:", e);
        }
        const totalSawah = sawahList.length;
        const sawahTersewa = sawahList.filter(
          (s: any) => s.status === "disewa",
        ).length;
        const totalLuas = sawahList.reduce(
          (sum, s) => sum + (s.luas_total || 0),
          0,
        );

        // 2. Data Penyewa
        let penyewaCount = { totalItems: 0 };
        try {
          penyewaCount = await pb
            .collection("penyewa")
            .getList(1, 1, { filter: 'status="aktif"' });
        } catch (e) {
          console.error("Gagal memuat data penyewa:", e);
        }

        // 3. Transaksi Sewa Aktif
        let trxAktif: Transaksi[] = [];
        try {
          trxAktif = await pb
            .collection("transaksi_sewa")
            .getFullList<Transaksi>({
              filter: 'status="aktif"',
              expand: "sawah,penyewa",
            });

          trxAktif.sort((a, b) => {
            return (
              new Date(a.tanggal_mulai).getTime() -
              new Date(b.tanggal_mulai).getTime()
            );
          });
        } catch (e) {
          console.error("Gagal memuat transaksi sewa:", e);
        }

        // 4. Tagihan Menunggak / Belum Lunas
        const tagihanMenunggak = trxAktif.filter(
          (t) => t.status_bayar !== "lunas",
        );

        // 5. Filter Transaksi yang sewanya sudah 4 bulan atau lebih
        const filteredLongTerm = trxAktif.filter((t) => {
          const months = calculateMonthCount(t.tanggal_mulai);
          return months >= 4;
        });

        // 6. Total Potensi Pendapatan Sewa Aktif
        const potensi = trxAktif.reduce(
          (sum, item) => sum + item.harga_sewa,
          0,
        );

        // 7. Arus Kas Nyata Bulan Ini
        let cashInThisMonth = 0;
        try {
          const bayarBulanIni = await pb
            .collection("riwayat_bayar")
            .getFullList<RiwayatBayar>({
              filter: `tanggal >= "${currentMonthPrefix}-01"`,
            });
          cashInThisMonth = bayarBulanIni.reduce(
            (sum, item) => sum + item.nominal,
            0,
          );
        } catch {
          cashInThisMonth = trxAktif.reduce(
            (sum, item) => sum + (item.nominal_dibayar || 0),
            0,
          );
        }

        // 8. Feed Aktivitas Terbaru (Log Bulanan)
        let logs: LogBulanan[] = [];
        try {
          const resLogs = await pb
            .collection("log_bulanan")
            .getList<LogBulanan>(1, 4, {
              sort: "-periode,-created",
              expand: "transaksi.sawah,transaksi.penyewa",
            });
          logs = resLogs.items;
        } catch (err) {
          console.error("Gagal memuat log bulanan:", err);
        }

        setStats({
          sawahTotal: totalSawah,
          sawahTersewa: sawahTersewa,
          penyewaAktif: penyewaCount.totalItems,
          transaksiAktif: trxAktif.length,
          potensiPendapatan: potensi,
          uangMasukBulanIni: cashInThisMonth,
          totalLuasLahan: totalLuas,
        });

        setActiveTrx(trxAktif.slice(0, 5));
        setOverdueTrx(tagihanMenunggak);
        setLongTermTrx(filteredLongTerm);
        setRecentLogs(logs);
      } catch (err) {
        console.error("Error umum dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const sendWATagihan = (trx: Transaksi) => {
    const penyewaNama = trx.expand?.penyewa?.nama || "Penyewa";
    const sawahNama = trx.expand?.sawah?.nama || "Sawah";
    const kontak = trx.expand?.penyewa?.kontak || "";
    const sisa = trx.harga_sewa - (trx.nominal_dibayar || 0);
    const jatuhTempo = trx.tanggal_jatuh_tempo
      ? formatDate(trx.tanggal_jatuh_tempo)
      : "-";
    const linkNota = `${window.location.origin}${ROUTES.NOTA_DETAIL(trx.id)}`;

    if (!kontak) {
      toast("Nomor kontak penyewa belum diisi pada data Penyewa!", "warning");
      return;
    }

    const pesan =
      `Halo Bp/Ibu *${penyewaNama}*,\n\n` +
      `Sekadar mengingatkan mengenai tagihan sewa sawah *${sawahNama}*.\n\n` +
      `• Total Sewa: Rp ${trx.harga_sewa.toLocaleString("id-ID")}\n` +
      `• Terbayar: Rp ${(trx.nominal_dibayar || 0).toLocaleString("id-ID")}\n` +
      `• *Sisa Tagihan: Rp ${sisa.toLocaleString("id-ID")}*\n` +
      `• Tanggal Jatuh Tempo: *${jatuhTempo}*\n\n` +
      `Rincian nota digital dapat diakses melalui link berikut:\n${linkNota}\n\n` +
      `Terima kasih. 🙏`;

    const waUrl = `https://wa.me/${formatWA(kontak)}?text=${encodeURIComponent(pesan)}`;
    window.open(waUrl, "_blank");
  };

  const occupancyRate =
    stats.sawahTotal > 0
      ? Math.round((stats.sawahTersewa / stats.sawahTotal) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. KARTU STATISTIK & WIDGET OKUPANSI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* OKUPANSI SAWAH */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Okupansi Sawah
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
              <PieChart size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">
              {occupancyRate}%
            </h3>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {stats.sawahTersewa} dari {stats.sawahTotal} sawah disewa
            </p>
          </div>
        </div>

        {/* TOTAL SAWAH & LUAS LAHAN */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500 text-white">
            <Sprout size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Aset Sawah
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {stats.sawahTotal} Petak
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">
              Total Luas: {stats.totalLuasLahan.toLocaleString("id-ID")} m²
            </p>
          </div>
        </div>

        {/* PENYEWA AKTIF */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-500 text-white">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Penyewa Aktif
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {stats.penyewaAktif}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Terdaftar aktif</p>
          </div>
        </div>

        {/* SEWA AKTIF */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500 text-white">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sewa Berjalan
            </p>
            <h3 className="text-2xl font-bold text-slate-800">
              {stats.transaksiAktif}
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-0.5">
              {overdueTrx.length} Belum Lunas
            </p>
          </div>
        </div>
      </div>

      {/* 2. PENDAPATAN & ARUS KAS NYATA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-6 sm:p-8 shadow-sm text-white flex flex-col justify-between relative overflow-hidden">
          <Banknote
            size={140}
            className="absolute -right-6 -bottom-6 text-emerald-500/20 pointer-events-none"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-600/50 pb-6 mb-6">
            <div>
              <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">
                Potensi Nilai Kontrak (Sewa Aktif)
              </p>
              <h3 className="text-3xl sm:text-4xl font-bold">
                Rp {stats.potensiPendapatan.toLocaleString("id-ID")}
              </h3>
            </div>
            <div className="bg-emerald-800/80 border border-emerald-600/60 p-4 rounded-xl shrink-0">
              <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <TrendingUp size={14} className="text-emerald-400" /> Setoran
                Masuk Bulan Ini
              </p>
              <p className="text-2xl font-extrabold text-white">
                Rp {stats.uangMasukBulanIni.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-emerald-200">
            <span>
              Data diperbarui secara real-time berdasarkan riwayat setoran.
            </span>
            <button
              onClick={() => navigate(ROUTES.ADMIN.LAPORAN)}
              className="hover:text-white font-semibold flex items-center gap-1 underline cursor-pointer"
            >
              Buka Laporan
            </button>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center gap-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Aksi Cepat
          </h4>
          <button
            onClick={() => navigate(ROUTES.ADMIN.TRANSAKSI())}
            className="flex items-center gap-2 w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-3 rounded-xl font-medium transition-colors border border-emerald-100 cursor-pointer"
          >
            <Plus size={18} /> Buat Transaksi Baru
          </button>
          <button
            onClick={() => navigate(ROUTES.ADMIN.LAPORAN)}
            className="flex items-center gap-2 w-full bg-slate-50 text-slate-700 hover:bg-slate-100 px-4 py-3 rounded-xl font-medium transition-colors border border-slate-200 cursor-pointer"
          >
            <FileText size={18} /> Lihat Laporan Keuangan
          </button>
        </div>
      </div>

      {/* 3. KARTU PERINGATAN TAGIHAN & JATUH TEMPO */}
      {!loading && overdueTrx.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <AlertTriangle className="text-amber-600" size={22} />
              <h3>Peringatan Tagihan & Jatuh Tempo ({overdueTrx.length})</h3>
            </div>
            <button
              onClick={() =>
                navigate(ROUTES.ADMIN.TRANSAKSI({ bayar: "menunggak" }))
              }
              className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Kelola Semua <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {overdueTrx.map((trx) => {
              const sisa = trx.harga_sewa - (trx.nominal_dibayar || 0);
              const todayStr = new Date().toISOString().split("T")[0];
              const isPastDue =
                trx.tanggal_jatuh_tempo && trx.tanggal_jatuh_tempo < todayStr;

              return (
                <div
                  key={trx.id}
                  className="bg-white p-4 rounded-xl border border-amber-200/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {trx.expand?.penyewa?.nama || "Penyewa"} —{" "}
                      <span className="text-emerald-700">
                        {trx.expand?.sawah?.nama || "Sawah"}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Sisa Tagihan:{" "}
                      <span className="font-bold text-red-600">
                        Rp {sisa.toLocaleString("id-ID")}
                      </span>{" "}
                      | Jatuh Tempo:{" "}
                      <span
                        className={`font-medium ${isPastDue ? "text-red-600 font-bold" : "text-slate-700"}`}
                      >
                        {trx.tanggal_jatuh_tempo
                          ? formatDate(trx.tanggal_jatuh_tempo)
                          : "Belum diatur"}{" "}
                        {isPastDue && "(Lewat Jatuh Tempo)"}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => sendWATagihan(trx)}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    <MessageCircle size={16} /> Tagih WA
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SECTION / CARD NOTIFIKASI SEWA >= 4 BULAN DAN BELUM SELESAI */}
      {!loading && longTermTrx.length > 0 && (
        <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <Hourglass className="text-purple-600" size={22} />
              <h3>
                Pemberitahuan Masa Sewa Panjang (≥ 4 Bulan Berjalan) (
                {longTermTrx.length})
              </h3>
            </div>
            <span className="text-xs text-purple-700 font-medium">
              Diurutkan dari durasi terlama
            </span>
          </div>
          <div className="space-y-3">
            {longTermTrx.map((trx) => {
              const monthCount = calculateMonthCount(trx.tanggal_mulai);
              return (
                <div
                  key={trx.id}
                  className="bg-white p-4 rounded-xl border border-purple-200/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-base">
                        {trx.expand?.sawah?.nama || "Sawah"}
                      </span>
                      <span className="bg-purple-100 text-purple-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                        {monthCount} Bulan Berjalan
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Penyewa:{" "}
                      <span className="font-semibold text-slate-700">
                        {trx.expand?.penyewa?.nama || "Penyewa"}
                      </span>{" "}
                      | Mulai Sewa:{" "}
                      <span className="font-medium text-slate-600">
                        {formatDate(trx.tanggal_mulai)}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      navigate(
                        ROUTES.ADMIN.TRANSAKSI({
                          q: trx.expand?.sawah?.nama || "",
                        }),
                      )
                    }
                    className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    <RotateCw size={14} /> Kelola Transaksi
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. GRID 2 KOLOM: TRANSAKSI AKTIF & FEED JURNAL AKTIVITAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TABEL SAWAH SEDANG DISEWA */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Sawah Sedang Disewa</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Diurutkan dari durasi sewa terlama (paling awal mulai).
              </p>
            </div>
            <button
              onClick={() => navigate(ROUTES.ADMIN.TRANSAKSI())}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Lihat Semua <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Memuat data...
            </div>
          ) : activeTrx.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <div className="text-4xl mb-3">🌾</div>
              <p className="text-sm">
                Tidak ada sawah yang sedang disewa saat ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Sawah & Penyewa</th>
                    <th className="px-6 py-4">Tanggal Mulai</th>
                    <th className="px-6 py-4">Durasi</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {activeTrx.map((trx) => (
                    <tr
                      key={trx.id}
                      className="hover:bg-emerald-50/30 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                            <Sprout size={16} className="text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm leading-tight group-hover:text-emerald-700 transition-colors">
                              {trx.expand?.sawah?.nama || "Sawah Dihapus"}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                              <Users size={12} className="text-slate-400" />
                              {trx.expand?.penyewa?.nama || "Penyewa Dihapus"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-800 text-sm">
                          {formatDate(trx.tanggal_mulai)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          <Clock size={12} />
                          {calculateDuration(trx.tanggal_mulai)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              navigate(
                                ROUTES.ADMIN.TRANSAKSI({
                                  q: trx.expand?.sawah?.nama || "",
                                }),
                              )
                            }
                            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all cursor-pointer shadow-xs"
                            title="Kelola Transaksi"
                          >
                            <ClipboardList size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: FEED AKTIVITAS SIKLUS SAWAH */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Calendar size={18} className="text-emerald-500" /> Aktivitas
              Siklus Sawah
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              Jurnal Terbaru
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Memuat aktivitas...
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 text-xs text-center">
              <ImageIcon size={32} className="opacity-40 mb-2" />
              <p>Belum ada catatan aktivitas siklus tanam yang diisi.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {recentLogs.map((log) => {
                const faseStyle = getFaseLabel(log.fase);
                const sawahNama =
                  log.expand?.transaksi?.expand?.sawah?.nama || "Sawah";

                return (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3"
                  >
                    {log.foto ? (
                      <img
                        // FIX WARNING: pb.files.getUrl -> pb.files.getURL
                        src={pb.files.getURL(log, log.foto)}
                        alt="Foto Aktivitas"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Sprout size={20} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-xs text-slate-800 truncate">
                          {sawahNama}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${faseStyle.bg}`}
                        >
                          {faseStyle.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {log.keterangan || "Aktivitas siklus diselesaikan."}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        {log.periode}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
