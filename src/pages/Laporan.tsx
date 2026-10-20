import { useEffect, useState, useMemo } from "react";
import { pb } from "../lib/pb";
import { useNotify } from "../contexts/NotificationContext";
import {
  FileText,
  Download,
  Banknote,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Filter,
  RotateCcw,
} from "lucide-react";

interface Sawah {
  id: string;
  nama: string;
}

interface Penyewa {
  id: string;
  nama: string;
}

interface TransaksiLaporan {
  id: string;
  sawah: string;
  penyewa: string;
  harga_sewa: number;
  nominal_dibayar: number;
  status_bayar: string;
  tanggal_mulai: string;
  created: string;
  expand?: {
    sawah?: { id: string; nama: string };
    penyewa?: { id: string; nama: string };
  };
}

interface RiwayatBayar {
  id: string;
  transaksi: string;
  nominal: number;
  tanggal: string;
  created: string;
  expand?: {
    transaksi?: {
      id: string;
      sawah?: string;
      penyewa?: string;
      expand?: {
        sawah?: { id: string; nama: string };
        penyewa?: { id: string; nama: string };
      };
    };
  };
}

export default function Laporan() {
  const { toast } = useNotify();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "ringkasan" | "riwayat" | "kontrak"
  >("ringkasan");

  // Master Data untuk Filter
  const [sawahList, setSawahList] = useState<Sawah[]>([]);
  const [penyewaList, setPenyewaList] = useState<Penyewa[]>([]);

  // State Filter
  const [filterBulan, setFilterBulan] = useState<string>(""); // Format: "YYYY-MM"
  const [filterSawah, setFilterSawah] = useState<string>(""); // Sawah ID
  const [filterPenyewa, setFilterPenyewa] = useState<string>(""); // Penyewa ID

  const [transaksiList, setTransaksiList] = useState<TransaksiLaporan[]>([]);
  const [riwayatBayarList, setRiwayatBayarList] = useState<RiwayatBayar[]>([]);

  useEffect(() => {
    async function fetchLaporanData() {
      try {
        setLoading(true);

        const [sawahRes, penyewaRes, trxRes, bayarRes] = await Promise.all([
          pb.collection("sawah").getFullList<Sawah>({ sort: "nama" }),
          pb.collection("penyewa").getFullList<Penyewa>({ sort: "nama" }),
          pb.collection("transaksi_sewa").getFullList<TransaksiLaporan>({
            expand: "sawah,penyewa",
            sort: "-created",
          }),
          pb.collection("riwayat_bayar").getFullList<RiwayatBayar>({
            expand: "transaksi.sawah,transaksi.penyewa",
            sort: "-tanggal",
          }),
        ]);

        setSawahList(sawahRes);
        setPenyewaList(penyewaRes);
        setTransaksiList(trxRes);
        setRiwayatBayarList(bayarRes);
      } catch (err) {
        console.error("Gagal memuat data laporan:", err);
        toast("Gagal memuat data laporan dari server.", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchLaporanData();
  }, [toast]);

  const handleResetFilter = () => {
    setFilterBulan("");
    setFilterSawah("");
    setFilterPenyewa("");
    toast("Filter berhasil direset.", "info");
  };

  const filteredTransaksiList = useMemo(() => {
    return transaksiList.filter((t) => {
      const matchSawah = filterSawah ? t.sawah === filterSawah : true;
      const matchPenyewa = filterPenyewa ? t.penyewa === filterPenyewa : true;
      return matchSawah && matchPenyewa;
    });
  }, [transaksiList, filterSawah, filterPenyewa]);

  const filteredRiwayatList = useMemo(() => {
    return riwayatBayarList.filter((item) => {
      const tanggalItem = item.tanggal || item.created;
      const matchBulan = filterBulan
        ? tanggalItem.startsWith(filterBulan)
        : true;

      const trx = item.expand?.transaksi;
      const matchSawah = filterSawah ? trx?.sawah === filterSawah : true;
      const matchPenyewa = filterPenyewa
        ? trx?.penyewa === filterPenyewa
        : true;

      return matchBulan && matchSawah && matchPenyewa;
    });
  }, [riwayatBayarList, filterBulan, filterSawah, filterPenyewa]);

  const totalPotensiKontrak = filteredTransaksiList.reduce(
    (acc, curr) => acc + (curr.harga_sewa || 0),
    0,
  );
  const totalKasMasuk = filteredRiwayatList.reduce(
    (acc, curr) => acc + (curr.nominal || 0),
    0,
  );

  const totalTunggakan = filteredTransaksiList
    .filter((t) => t.status_bayar !== "lunas")
    .reduce(
      (acc, curr) => acc + (curr.harga_sewa - (curr.nominal_dibayar || 0)),
      0,
    );

  const transaksiLunasCount = filteredTransaksiList.filter(
    (t) => t.status_bayar === "lunas",
  ).length;
  const transaksiBelumLunasCount = filteredTransaksiList.filter(
    (t) => t.status_bayar !== "lunas",
  ).length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleExportCSV = () => {
    if (filteredRiwayatList.length === 0) {
      toast(
        "Tidak ada data riwayat yang sesuai filter untuk diexport.",
        "warning",
      );
      return;
    }

    let csvContent =
      "data:text/csv;charset=utf-8,ID,Tanggal,Penyewa,Sawah,Nominal\n";
    filteredRiwayatList.forEach((item) => {
      const penyewa = item.expand?.transaksi?.expand?.penyewa?.nama || "-";
      const sawah = item.expand?.transaksi?.expand?.sawah?.nama || "-";
      csvContent += `${item.id},${item.tanggal || item.created},"${penyewa}","${sawah}",${item.nominal}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `laporan_keuangan_${filterBulan || "semua"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Laporan berhasil diunduh dalam format CSV.", "success");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="text-emerald-600 shrink-0" size={26} /> Laporan
            & Keuangan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitulasi arus kas setoran, status tagihan, dan nilai kontrak
            sewa lahan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* PANEL FILTER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Filter size={18} className="text-emerald-600" /> Filter Laporan
          </h3>
          {(filterBulan || filterSawah || filterPenyewa) && (
            <button
              onClick={handleResetFilter}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={14} /> Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Bulan & Tahun
            </label>
            <input
              type="month"
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Petak Sawah
            </label>
            <select
              value={filterSawah}
              onChange={(e) => setFilterSawah(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Sawah</option>
              {sawahList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Penyewa
            </label>
            <select
              value={filterPenyewa}
              onChange={(e) => setFilterPenyewa(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Penyewa</option>
              {penyewaList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KARTU STATISTIK UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500 text-white shrink-0">
            <Banknote size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Kas Masuk
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 truncate">
              Rp {totalKasMasuk.toLocaleString("id-ID")}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">
              Berdasarkan filter aktif
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500 text-white shrink-0">
            <TrendingUp size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Potensi Kontrak Sewa
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 truncate">
              Rp {totalPotensiKontrak.toLocaleString("id-ID")}
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-0.5">
              Nilai kontrak tersaring
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-red-500 text-white shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Sisa / Piutang Menunggak
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 truncate">
              Rp {totalTunggakan.toLocaleString("id-ID")}
            </h3>
            <p className="text-xs text-red-600 font-medium mt-0.5">
              {transaksiBelumLunasCount} kontrak belum lunas
            </p>
          </div>
        </div>
      </div>

      {/* TAB NAVIGASI LAPORAN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/60 p-3 gap-2">
          <button
            onClick={() => setActiveTab("ringkasan")}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "ringkasan"
                ? "bg-white text-emerald-700 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ringkasan Keuangan
          </button>
          <button
            onClick={() => setActiveTab("riwayat")}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "riwayat"
                ? "bg-white text-emerald-700 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Riwayat Setoran ({filteredRiwayatList.length})
          </button>
          <button
            onClick={() => setActiveTab("kontrak")}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === "kontrak"
                ? "bg-white text-emerald-700 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Status Kontrak ({filteredTransaksiList.length})
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Memuat data laporan...
            </div>
          ) : activeTab === "ringkasan" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />{" "}
                    Status Pembayaran Kontrak
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-600">Kontrak Lunas</span>
                      <span className="font-bold text-emerald-600">
                        {transaksiLunasCount} Kontrak
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-600">
                        Kontrak Belum Lunas / Menunggak
                      </span>
                      <span className="font-bold text-red-600">
                        {transaksiBelumLunasCount} Kontrak
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Filter size={18} className="text-blue-600" /> Informasi
                    Filter Aktif
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ringkasan dan data di bawah ini telah disesuaikan secara
                    otomatis berdasarkan parameter filter bulan, sawah, dan
                    penyewa yang Anda pilih di atas.
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === "riwayat" ? (
            <div>
              {/* TAMPILAN CARD KHUSUS HP */}
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {filteredRiwayatList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Tidak ada riwayat setoran yang sesuai dengan filter.
                  </div>
                ) : (
                  filteredRiwayatList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900 block text-sm">
                            {item.expand?.transaksi?.expand?.penyewa?.nama ||
                              "Penyewa Dihapus"}
                          </span>
                          <span className="text-slate-500 font-medium block mt-0.5">
                            {item.expand?.transaksi?.expand?.sawah?.nama ||
                              "Sawah Dihapus"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          {formatDate(item.tanggal || item.created)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center">
                        <span className="text-slate-500 font-semibold">
                          Nominal Setoran:
                        </span>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          Rp {(item.nominal || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* TAMPILAN TABEL UNTUK DESKTOP */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Tanggal Setor</th>
                      <th className="px-4 py-3">Penyewa</th>
                      <th className="px-4 py-3">Sawah</th>
                      <th className="px-4 py-3 text-right">Nominal Masuk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRiwayatList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-8 text-slate-400 text-xs"
                        >
                          Tidak ada riwayat setoran yang sesuai dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRiwayatList.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-4 py-3.5 text-slate-600 text-xs font-medium">
                            {formatDate(item.tanggal || item.created)}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">
                            {item.expand?.transaksi?.expand?.penyewa?.nama ||
                              "Penyewa Dihapus"}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            {item.expand?.transaksi?.expand?.sawah?.nama ||
                              "Sawah Dihapus"}
                          </td>
                          <td className="px-4 py-3.5 text-right font-extrabold text-emerald-600">
                            Rp {(item.nominal || 0).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              {/* TAMPILAN CARD KHUSUS HP */}
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {filteredTransaksiList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Tidak ada data kontrak yang sesuai dengan filter.
                  </div>
                ) : (
                  filteredTransaksiList.map((t) => {
                    const isLunas = t.status_bayar === "lunas";
                    const sisa = t.harga_sewa - (t.nominal_dibayar || 0);

                    return (
                      <div
                        key={t.id}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">
                              {t.expand?.penyewa?.nama || "Penyewa Dihapus"}
                            </span>
                            <span className="text-emerald-700 font-semibold block mt-0.5">
                              {t.expand?.sawah?.nama || "Sawah Dihapus"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                            Mulai: {formatDate(t.tanggal_mulai)}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                          <span className="text-slate-500">Nilai Kontrak:</span>
                          <span className="font-bold text-slate-800">
                            Rp {t.harga_sewa.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-500 font-semibold">
                            Status Bayar:
                          </span>
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isLunas
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isLunas
                              ? "Lunas"
                              : `Kurang: Rp ${sisa.toLocaleString("id-ID")}`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* TAMPILAN TABEL UNTUK DESKTOP */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Penyewa & Sawah</th>
                      <th className="px-4 py-3">Mulai Sewa</th>
                      <th className="px-4 py-3">Harga Kontrak</th>
                      <th className="px-4 py-3">Status Bayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredTransaksiList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-8 text-slate-400 text-xs"
                        >
                          Tidak ada data kontrak yang sesuai dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTransaksiList.map((t) => {
                        const isLunas = t.status_bayar === "lunas";
                        const sisa = t.harga_sewa - (t.nominal_dibayar || 0);

                        return (
                          <tr
                            key={t.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-slate-900">
                                {t.expand?.penyewa?.nama || "Penyewa Dihapus"}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {t.expand?.sawah?.nama || "Sawah Dihapus"}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 text-xs">
                              {formatDate(t.tanggal_mulai)}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-slate-800">
                              Rp {t.harga_sewa.toLocaleString("id-ID")}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                  isLunas
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {isLunas
                                  ? "Lunas"
                                  : `Kurang: Rp ${sisa.toLocaleString("id-ID")}`}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
