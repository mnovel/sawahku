import { useEffect, useState } from "react";
import { pb } from "../lib/pb";
import { useNotify } from "../contexts/NotificationContext";
import {
  FileText,
  Download,
  Filter,
  Banknote,
  Sprout,
  Users,
  ChevronDown,
  Wallet,
  AlertCircle,
} from "lucide-react";

interface Sawah {
  id: string;
  nama: string;
}
interface Penyewa {
  id: string;
  nama: string;
}
interface Transaksi {
  id: string;
  tanggal_mulai: string;
  tanggal_panen: string;
  harga_sewa: number;
  status: string;
  status_bayar: string;
  nominal_dibayar: number;
  expand?: {
    sawah: Sawah;
    penyewa: Penyewa;
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

export default function Laporan() {
  const { toast } = useNotify();
  const [list, setList] = useState<Transaksi[]>([]);
  const [bayarList, setBayarList] = useState<RiwayatBayar[]>([]);
  const [sawahList, setSawahList] = useState<Sawah[]>([]);
  const [penyewaList, setPenyewaList] = useState<Penyewa[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [filterBulan, setFilterBulan] = useState(defaultMonth);
  const [filterSawah, setFilterSawah] = useState("semua");
  const [filterPenyewa, setFilterPenyewa] = useState("semua");

  async function loadData() {
    setLoading(true);
    try {
      const data = await pb
        .collection("transaksi_sewa")
        .getFullList<Transaksi>({
          filter: 'status != "batal"',
          sort: "-tanggal_mulai",
          expand: "sawah,penyewa",
        });
      const rbData = await pb
        .collection("riwayat_bayar")
        .getFullList<RiwayatBayar>();
      const sawahData = await pb
        .collection("sawah")
        .getFullList<Sawah>({ sort: "nama" });
      const penyewaData = await pb
        .collection("penyewa")
        .getFullList<Penyewa>({ sort: "nama" });

      setList(data);
      setBayarList(rbData);
      setSawahList(sawahData);
      setPenyewaList(penyewaData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter transaksi utama berdasarkan bulan mulai, sawah, dan penyewa
  const filteredList = list.filter((trx) => {
    const matchBulan = trx.tanggal_mulai.startsWith(filterBulan);
    const matchSawah =
      filterSawah === "semua" || trx.expand?.sawah?.id === filterSawah;
    const matchPenyewa =
      filterPenyewa === "semua" || trx.expand?.penyewa?.id === filterPenyewa;
    return matchBulan && matchSawah && matchPenyewa;
  });

  // Ambil ID transaksi dari filteredList untuk mencocokkan riwayat pembayaran aktual pada bulan filter
  const filteredTrxIds = new Set(filteredList.map((t) => t.id));

  // Metrik Keuangan
  const totalNilaiKontrak = filteredList.reduce(
    (sum, item) => sum + item.harga_sewa,
    0,
  );

  // Uang masuk nyata berdasarkan riwayat bayar yang tanggal pembayarannya masuk di bulan filter
  const uangMasukBulanIni = bayarList
    .filter(
      (rb) =>
        rb.tanggal.startsWith(filterBulan) &&
        filteredTrxIds.has((rb as any).transaksi),
    )
    .reduce((sum, item) => sum + item.nominal, 0);

  const totalTunggakan = filteredList.reduce((sum, item) => {
    const dibayar = item.nominal_dibayar || 0;
    return sum + Math.max(0, item.harga_sewa - dibayar);
  }, 0);

  const totalTransaksi = filteredList.length;

  const handleExportCSV = () => {
    if (filteredList.length === 0)
      return toast("Tidak ada data untuk diexport.", "warning");

    const headers = [
      "Tanggal Mulai",
      "Sawah",
      "Penyewa",
      "Harga Sewa",
      "Terbayar",
      "Sisa Tagihan",
      "Status Bayar",
      "Status Sewa",
    ];
    const rows = filteredList.map((trx) => {
      const terbayar = trx.nominal_dibayar || 0;
      const sisa = Math.max(0, trx.harga_sewa - terbayar);
      return [
        trx.tanggal_mulai.split(" ")[0],
        trx.expand?.sawah?.nama || "-",
        trx.expand?.penyewa?.nama || "-",
        trx.harga_sewa,
        terbayar,
        sisa,
        trx.status_bayar,
        trx.status,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Keuangan_${filterBulan}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Laporan CSV berhasil di-export!", "success");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-emerald-500" /> Laporan Keuangan & Sewa
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Rekapitulasi kontrak, setoran kas masuk, dan tunggakan sewa.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm cursor-pointer"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* BARIS FILTER */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative flex items-center bg-slate-50 border border-slate-300 rounded-xl hover:border-slate-400 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all">
          <Filter size={18} className="text-slate-400 absolute left-3" />
          <input
            type="month"
            value={filterBulan}
            onChange={(e) => setFilterBulan(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-transparent outline-none text-sm font-medium text-slate-700 cursor-pointer"
          />
        </div>

        <div className="flex-1 relative flex items-center bg-slate-50 border border-slate-300 rounded-xl hover:border-slate-400 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all">
          <Sprout size={18} className="text-emerald-500 absolute left-3" />
          <select
            value={filterSawah}
            onChange={(e) => setFilterSawah(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-transparent outline-none text-sm font-medium text-slate-700 cursor-pointer appearance-none"
          >
            <option value="semua">Semua Sawah</option>
            {sawahList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="text-slate-400 absolute right-3 pointer-events-none"
          />
        </div>

        <div className="flex-1 relative flex items-center bg-slate-50 border border-slate-300 rounded-xl hover:border-slate-400 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all">
          <Users size={18} className="text-blue-500 absolute left-3" />
          <select
            value={filterPenyewa}
            onChange={(e) => setFilterPenyewa(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-transparent outline-none text-sm font-medium text-slate-700 cursor-pointer appearance-none"
          >
            <option value="semua">Semua Penyewa</option>
            {penyewaList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="text-slate-400 absolute right-3 pointer-events-none"
          />
        </div>
      </div>

      {/* KARTU RINGKASAN LENGKAP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-emerald-100 text-emerald-600">
            <Banknote size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Nilai Kontrak
            </p>
            <h3 className="text-xl font-bold text-slate-800">
              Rp {totalNilaiKontrak.toLocaleString("id-ID")}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalTransaksi} Transaksi Terpilih
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-blue-100 text-blue-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Kas Masuk (Aktual)
            </p>
            <h3 className="text-xl font-bold text-blue-700">
              Rp {uangMasukBulanIni.toLocaleString("id-ID")}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setoran masuk bulan ini
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-red-100 text-red-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sisa Tunggakan
            </p>
            <h3 className="text-xl font-bold text-red-600">
              Rp {totalTunggakan.toLocaleString("id-ID")}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Belum terbayar</p>
          </div>
        </div>
      </div>

      {/* TABEL LAPORAN */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tgl Mulai
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Sawah & Penyewa
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Harga Kontrak
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Terbayar
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status Bayar
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Status Sewa
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((trx) => {
                  const terbayar = trx.nominal_dibayar || 0;
                  const isLunas =
                    trx.status_bayar === "lunas" || terbayar >= trx.harga_sewa;

                  return (
                    <tr
                      key={trx.id}
                      className="hover:bg-slate-50/80 transition-colors text-sm"
                    >
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(trx.tanggal_mulai)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {trx.expand?.sawah?.nama || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {trx.expand?.penyewa?.nama || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        Rp {trx.harga_sewa.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-emerald-600 font-medium">
                        Rp {terbayar.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${
                            isLunas
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : terbayar > 0
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-red-100 text-red-700 border-red-200"
                          }`}
                        >
                          {isLunas
                            ? "Lunas"
                            : terbayar > 0
                              ? "DP / Sebagian"
                              : "Belum Bayar"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            trx.status === "aktif"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {trx.status === "aktif" ? "Berjalan" : "Selesai"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredList.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      Tidak ada data transaksi yang cocok dengan filter Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
