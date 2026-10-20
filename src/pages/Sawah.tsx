import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { pb } from "../lib/pb";
import { useNotify } from "../contexts/NotificationContext";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  MapPin,
  Ruler,
  Banknote,
  Sprout,
  Search,
  ExternalLink,
  Map,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SawahType {
  id: string;
  nama: string;
  luas_m2: number;
  lokasi: string;
  harga_sewa: number;
  status: string;
  tipe_hak?: string;
  nib?: string;
  maps?: string;
  bhumi?: string;
}

const formatRupiah = (value: string | number) => {
  const numberString = value.toString().replace(/[^,\d]/g, "");
  if (!numberString) return "";
  return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function Sawah() {
  const { toast, confirm } = useNotify();
  const navigate = useNavigate();

  const [list, setList] = useState<SawahType[]>([]);
  const [loading, setLoading] = useState(true);

  // State Form dengan field tambahan
  const [form, setForm] = useState({
    nama: "",
    luas_m2: "",
    lokasi: "",
    harga_sewa: "",
    tipe_hak: "hak milik",
    nib: "",
    maps: "",
    bhumi: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // State untuk Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  async function load() {
    setLoading(true);
    try {
      const data = await pb
        .collection("sawah")
        .getFullList<SawahType>({ sort: "-created" });
      setList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Reset halaman ke 1 jika pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanHarga = form.harga_sewa.replace(/\./g, "");
    const payload = {
      ...form,
      luas_m2: Number(form.luas_m2),
      harga_sewa: Number(cleanHarga),
    };

    try {
      if (editId) await pb.collection("sawah").update(editId, payload);
      else
        await pb.collection("sawah").create({ ...payload, status: "tersedia" });

      setIsModalOpen(false);
      setForm({
        nama: "",
        luas_m2: "",
        lokasi: "",
        harga_sewa: "",
        tipe_hak: "hak milik",
        nib: "",
        maps: "",
        bhumi: "",
      });
      setEditId(null);
      toast(
        editId
          ? "Data sawah berhasil diperbarui!"
          : "Sawah baru berhasil ditambahkan!",
        "success",
      );
      load();
    } catch (err) {
      toast("Gagal menyimpan data sawah.", "error");
    }
  }

  function handleDelete(id: string) {
    confirm({
      title: "Hapus Sawah?",
      message:
        "Data yang dihapus tidak dapat dikembalikan. Pastikan tidak ada transaksi aktif pada sawah ini.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await pb.collection("sawah").delete(id);
          toast("Data sawah berhasil dihapus.", "info");
          load();
        } catch (err) {
          toast(
            "Gagal menghapus sawah. Sawah mungkin masih terikat dengan transaksi.",
            "error",
          );
        }
      },
    });
  }

  // Logika Filter Pencarian
  const filteredList = list.filter((s) => {
    const query = searchQuery.toLowerCase();
    return (
      s.nama?.toLowerCase().includes(query) ||
      s.lokasi?.toLowerCase().includes(query) ||
      s.nib?.toLowerCase().includes(query) ||
      s.tipe_hak?.toLowerCase().includes(query)
    );
  });

  // Logika Pagination
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredList.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sprout className="text-emerald-500" /> Daftar Aset Sawah
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola data luas, lokasi, legalitas, dan harga sewa sawah Anda.
          </p>
        </div>
        <button
          onClick={() => {
            setForm({
              nama: "",
              luas_m2: "",
              lokasi: "",
              harga_sewa: "",
              tipe_hak: "hak milik",
              nib: "",
              maps: "",
              bhumi: "",
            });
            setEditId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-emerald-200 hover:shadow-md cursor-pointer"
        >
          <Plus size={18} /> Tambah Sawah
        </button>
      </div>

      {/* BARIS PENCARIAN */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama, lokasi, NIB, atau tipe hak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Memuat data sawah...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nama & Legalitas
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Luas & Lokasi
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Harga Sewa
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Peta & Bhumi
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentItems.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {s.nama}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span className="uppercase font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {s.tipe_hak || "Hak Milik"}
                        </span>
                        {s.nib && <span className="ml-2">NIB: {s.nib}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">
                        {s.luas_m2} m²
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {s.lokasi || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      Rp {s.harga_sewa.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Tombol Maps */}
                        {s.maps ? (
                          <a
                            href={
                              s.maps.includes("http")
                                ? s.maps
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.maps)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                            title="Buka Google Maps"
                          >
                            <Map size={14} />
                            Maps <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}

                        {/* Tombol Bhumi ATR */}
                        {s.bhumi ? (
                          <a
                            href={s.bhumi}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-200 hover:bg-amber-100 transition-colors"
                            title="Buka Bhumi ATR"
                          >
                            <Globe size={14} /> Bhumi <ExternalLink size={10} />
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          s.status === "tersedia"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {s.status === "tersedia" ? "Tersedia" : "Disewa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            navigate(
                              `/transaksi?q=${encodeURIComponent(s.nama)}`,
                            )
                          }
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Transaksi Sawah Ini"
                        >
                          <Search size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setForm({
                              nama: s.nama,
                              luas_m2: s.luas_m2.toString(),
                              lokasi: s.lokasi,
                              harga_sewa: formatRupiah(s.harga_sewa),
                              tipe_hak: s.tipe_hak || "hak milik",
                              nib: s.nib || "",
                              maps: s.maps || "",
                              bhumi: s.bhumi || "",
                            });
                            setEditId(s.id);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      {searchQuery
                        ? "Tidak ada data sawah yang cocok dengan pencarian."
                        : "Belum ada data sawah. Silakan tambah data baru."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filteredList.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
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
              data sawah
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
      </div>

      {/* MODAL FORM TAMBAH / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editId ? "Edit Data Sawah" : "Tambah Sawah Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Sawah
                </label>
                <div className="relative">
                  <Sprout
                    className="absolute left-3 top-2.5 text-slate-400"
                    size={18}
                  />
                  <input
                    required
                    placeholder="Contoh: Blok Plinggisan"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Tipe Hak
                  </label>
                  <select
                    value={form.tipe_hak}
                    onChange={(e) =>
                      setForm({ ...form, tipe_hak: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm cursor-pointer font-medium text-slate-700"
                  >
                    <option value="hak milik">Hak Milik</option>
                    <option value="hak guna usaha">Hak Guna Usaha</option>
                    <option value="hak guna bangunan">Hak Guna Bangunan</option>
                    <option value="hak pakai">Hak Pakai</option>
                    <option value="hak pengelolaan">Hak Pengelolaan</option>
                    <option value="hak wakaf">Hak Wakaf</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    NIB (Nomor Induk Bidang)
                  </label>
                  <input
                    placeholder="Contoh: 123456789"
                    value={form.nib}
                    onChange={(e) => setForm({ ...form, nib: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Luas (m²)
                  </label>
                  <div className="relative">
                    <Ruler
                      className="absolute left-3 top-2.5 text-slate-400"
                      size={18}
                    />
                    <input
                      required
                      type="number"
                      placeholder="1222"
                      value={form.luas_m2}
                      onChange={(e) =>
                        setForm({ ...form, luas_m2: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Harga / Panen (Rp)
                  </label>
                  <div className="relative">
                    <Banknote
                      className="absolute left-3 top-2.5 text-slate-400"
                      size={18}
                    />
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      placeholder="700.000"
                      value={form.harga_sewa}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          harga_sewa: formatRupiah(e.target.value),
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Lokasi / Keterangan
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-2.5 text-slate-400"
                    size={18}
                  />
                  <input
                    placeholder="Contoh: Desa Sukamaju, RT 02"
                    value={form.lokasi}
                    onChange={(e) =>
                      setForm({ ...form, lokasi: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Link / Embed Google Maps
                  </label>
                  <input
                    placeholder="https://goo.gl/maps/... atau iframe"
                    value={form.maps}
                    onChange={(e) => setForm({ ...form, maps: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Shortlink Bhumi ATR/BPN
                  </label>
                  <input
                    placeholder="https://bhumi.atrbpn.go.id/..."
                    value={form.bhumi}
                    onChange={(e) =>
                      setForm({ ...form, bhumi: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
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
    </div>
  );
}
