import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { pb } from "../lib/pb";
import { useNotify } from "../contexts/NotificationContext";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  User,
  Phone,
  MapPin,
  Users,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sprout,
  Calendar,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";

interface PenyewaType {
  id: string;
  nama: string;
  kontak: string;
  alamat: string;
  status: string;
}

interface TransaksiPenyewa {
  id: string;
  tanggal_mulai: string;
  tanggal_panen?: string;
  tanggal_jatuh_tempo?: string;
  harga_sewa: number;
  status: string;
  status_bayar: string;
  nominal_dibayar: number;
  expand?: {
    sawah?: { nama: string };
  };
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function Penyewa() {
  const { toast, confirm } = useNotify();
  const navigate = useNavigate();

  const [list, setList] = useState<PenyewaType[]>([]);
  const [loading, setLoading] = useState(true);

  // State Form & Modal Edit/Tambah
  const [form, setForm] = useState({
    nama: "",
    kontak: "",
    alamat: "",
    status: "aktif",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // State Search, Filter & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State Modal Detail & Kredibilitas
  const [selectedPenyewa, setSelectedPenyewa] = useState<PenyewaType | null>(
    null,
  );
  const [historyList, setHistoryList] = useState<TransaksiPenyewa[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const sortQuery = sortOrder === "asc" ? "nama" : "-nama";
      const data = await pb
        .collection("penyewa")
        .getFullList<PenyewaType>({ sort: sortQuery });
      setList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, sortOrder]);

  // LOGIKA FILTER (Pencarian + Status)
  const filteredList = list.filter((p) => {
    const keyword = searchQuery.toLowerCase();
    const matchSearch =
      p.nama?.toLowerCase().includes(keyword) ||
      p.kontak?.toLowerCase().includes(keyword) ||
      p.alamat?.toLowerCase().includes(keyword);

    const matchStatus = filterStatus === "semua" || p.status === filterStatus;

    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredList.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editId) await pb.collection("penyewa").update(editId, form);
      else await pb.collection("penyewa").create(form);

      setIsModalOpen(false);
      setForm({ nama: "", kontak: "", alamat: "", status: "aktif" });
      setEditId(null);
      toast(
        editId
          ? "Data penyewa berhasil diperbarui!"
          : "Penyewa baru berhasil ditambahkan!",
        "success",
      );
      load();
    } catch (err) {
      toast("Gagal menyimpan data penyewa.", "error");
    }
  }

  function handleDelete(id: string) {
    confirm({
      title: "Hapus Penyewa?",
      message:
        "Data yang dihapus tidak dapat dikembalikan. Pastikan tidak ada transaksi aktif untuk penyewa ini.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await pb.collection("penyewa").delete(id);
          toast("Data penyewa berhasil dihapus.", "info");
          load();
        } catch (err) {
          toast(
            "Gagal menghapus penyewa. Penyewa mungkin masih memiliki riwayat transaksi.",
            "error",
          );
        }
      },
    });
  }

  async function openDetailModal(penyewa: PenyewaType) {
    setSelectedPenyewa(penyewa);
    setIsDetailOpen(true);
    setLoadingHistory(true);
    try {
      const trxData = await pb
        .collection("transaksi_sewa")
        .getFullList<TransaksiPenyewa>({
          filter: `penyewa="${penyewa.id}"`,
          expand: "sawah",
          sort: "-created",
        });
      setHistoryList(trxData);
    } catch (err) {
      console.error(err);
      toast("Gagal memuat riwayat transaksi penyewa.", "error");
    } finally {
      setLoadingHistory(false);
    }
  }

  const totalSewa = historyList.length;
  const totalNominal = historyList.reduce((sum, t) => sum + t.harga_sewa, 0);
  const totalDibayar = historyList.reduce(
    (sum, t) => sum + (t.nominal_dibayar || 0),
    0,
  );
  const totalTunggakan = Math.max(0, totalNominal - totalDibayar);
  const menunggakTrx = historyList.filter(
    (t) => t.status_bayar !== "lunas" && t.status === "aktif",
  ).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-emerald-500" /> Daftar Penyewa
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola data identitas, kontak, dan kredibilitas para penyewa sawah.
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ nama: "", kontak: "", alamat: "", status: "aktif" });
            setEditId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-emerald-200 hover:shadow-md cursor-pointer"
        >
          <Plus size={18} /> Tambah Penyewa
        </button>
      </div>

      {/* BARIS PENCARIAN, FILTER & SORTING */}
      <div className="flex flex-col lg:flex-row items-center gap-3 mb-6">
        {/* Kolom Pencarian */}
        <div className="relative w-full lg:flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama, kontak, atau alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm"
          />
        </div>

        {/* Wrapper untuk Dropdown Filter & Tombol Urutkan agar tidak terlalu lebar */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Dropdown Status */}
          <div className="relative w-full sm:w-48">
            <Filter
              className="absolute left-3 top-3 text-slate-400"
              size={20}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm appearance-none cursor-pointer text-slate-700 font-medium text-sm"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Non-Aktif</option>
            </select>
            <div className="absolute right-3 top-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>

          {/* Tombol Urutkan Nama */}
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <ArrowUpDown size={16} className="text-slate-500" />
            <span className="truncate">
              Urutkan: {sortOrder === "asc" ? "A - Z" : "Z - A"}
            </span>
          </button>
        </div>
      </div>

      {/* TABEL DATA PENYEWA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Memuat data penyewa...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Nama Penyewa
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Kontak (HP)
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Alamat
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentItems.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-emerald-50/30 transition-colors group"
                  >
                    {/* KOLOM 1: NAMA */}
                    <td className="px-6 py-5 align-top whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                          <User size={16} className="text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-base leading-tight group-hover:text-emerald-700 transition-colors">
                            {p.nama}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* KOLOM 2: KONTAK */}
                    <td className="px-6 py-5 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <Phone size={14} className="text-slate-400" />
                        {p.kontak || "-"}
                      </div>
                    </td>

                    {/* KOLOM 3: ALAMAT */}
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-start gap-1.5 text-sm text-slate-600 max-w-[250px]">
                        <MapPin
                          size={16}
                          className="text-slate-400 shrink-0 mt-0.5"
                        />
                        <span className="line-clamp-2">{p.alamat || "-"}</span>
                      </div>
                    </td>

                    {/* KOLOM 4: STATUS */}
                    <td className="px-6 py-5 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                          p.status === "aktif"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === "aktif"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-slate-400"
                          }`}
                        ></span>
                        {p.status === "aktif" ? "Aktif" : "Non-Aktif"}
                      </span>
                    </td>

                    {/* KOLOM 5: AKSI (Gaya Transaksi.tsx) */}
                    <td className="px-6 py-5 align-middle text-right">
                      <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {/* Kelompok 1: Aksi Utama */}
                        <button
                          onClick={() =>
                            navigate(ROUTES.ADMIN.TRANSAKSI({ penyewa: p.id }))
                          }
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all cursor-pointer shadow-xs"
                          title="Lihat Transaksi Penyewa"
                        >
                          <ClipboardList size={16} />
                        </button>

                        <button
                          onClick={() => openDetailModal(p)}
                          className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all cursor-pointer shadow-xs"
                          title="Lihat Profil & Kredibilitas"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Garis Pemisah */}
                        <div className="w-[1px] h-5 bg-slate-300 mx-1 shrink-0"></div>

                        {/* Kelompok 2: Aksi Sekunder */}
                        <button
                          onClick={() => {
                            setForm({
                              nama: p.nama,
                              kontak: p.kontak || "",
                              alamat: p.alamat || "",
                              status: p.status || "aktif",
                            });
                            setEditId(p.id);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {currentItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      Tidak ada data penyewa yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {!loading && filteredList.length > 0 && (
        <div className="px-6 py-4 mt-4 border border-slate-200 bg-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Menampilkan{" "}
            <span className="font-semibold text-slate-700">
              {startIndex + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(startIndex + itemsPerPage, filteredList.length)}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-slate-700">
              {filteredList.length}
            </span>{" "}
            data penyewa
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                  currentPage === index + 1
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT PENYEWA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editId ? "Edit Data Penyewa" : "Tambah Penyewa Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-2.5 text-slate-400"
                    size={18}
                  />
                  <input
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nomor HP / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-2.5 text-slate-400"
                      size={18}
                    />
                    <input
                      placeholder="0812..."
                      value={form.kontak}
                      onChange={(e) =>
                        setForm({ ...form, kontak: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer font-medium text-slate-700"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Alamat Lengkap
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-3 text-slate-400"
                    size={18}
                  />
                  <textarea
                    placeholder="Contoh: Desa Sukamaju, RT 02/RW 03"
                    value={form.alamat}
                    onChange={(e) =>
                      setForm({ ...form, alamat: e.target.value })
                    }
                    rows={3}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm shadow-emerald-200 transition-all cursor-pointer"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROFIL KREDIBILITAS & RIWAYAT */}
      {isDetailOpen && selectedPenyewa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <User className="text-emerald-500" /> Profil & Kredibilitas
                  Penyewa
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {selectedPenyewa.nama}{" "}
                  {selectedPenyewa.kontak ? `• ${selectedPenyewa.kontak}` : ""}
                </p>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    totalSewa === 0
                      ? "bg-slate-50 border-slate-200 text-slate-700"
                      : menunggakTrx > 0
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-75">
                    Status Kredibilitas
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {totalSewa === 0 ? (
                      <Clock size={22} className="text-slate-400" />
                    ) : menunggakTrx > 0 ? (
                      <ShieldAlert size={22} className="text-amber-600" />
                    ) : (
                      <ShieldCheck size={22} className="text-emerald-600" />
                    )}
                    <span className="font-bold text-sm">
                      {totalSewa === 0
                        ? "Belum Ada Sewa"
                        : menunggakTrx > 0
                          ? "Perlu Perhatian"
                          : "Lancar / Baik"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Riwayat Sewa
                  </p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {totalSewa} Transaksi
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Nilai Kontrak
                  </p>
                  <p className="text-lg font-bold text-slate-800 mt-1">
                    Rp {totalNominal.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Sisa Tunggakan
                  </p>
                  <p
                    className={`text-lg font-bold mt-1 ${
                      totalTunggakan > 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    Rp {totalTunggakan.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                  <Calendar size={16} className="text-emerald-500" /> Riwayat
                  Sewa Aset Sawah
                </h4>

                {loadingHistory ? (
                  <div className="p-8 text-center text-slate-400">
                    Memuat riwayat sewa...
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-xl">
                    Penyewa ini belum pernah melakukan transaksi sewa sawah.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Sawah</th>
                          <th className="px-4 py-3">Tgl Mulai</th>
                          <th className="px-4 py-3">Harga Sewa</th>
                          <th className="px-4 py-3">Terbayar</th>
                          <th className="px-4 py-3">Status Bayar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {historyList.map((trx) => (
                          <tr key={trx.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                              <Sprout size={16} className="text-emerald-500" />{" "}
                              {trx.expand?.sawah?.nama || "Sawah Dihapus"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatDate(trx.tanggal_mulai)}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              Rp {trx.harga_sewa.toLocaleString("id-ID")}
                            </td>
                            <td className="px-4 py-3 text-emerald-600 font-medium">
                              Rp{" "}
                              {(trx.nominal_dibayar || 0).toLocaleString(
                                "id-ID",
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${
                                  trx.status_bayar === "lunas"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : trx.status_bayar === "dp"
                                      ? "bg-amber-100 text-amber-700 border-amber-200"
                                      : "bg-red-100 text-red-700 border-red-200"
                                }`}
                              >
                                {trx.status_bayar === "belum_bayar"
                                  ? "Belum Bayar"
                                  : trx.status_bayar === "dp"
                                    ? "DP"
                                    : "Lunas"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
