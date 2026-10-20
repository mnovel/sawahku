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
  Sprout,
  Search,
  ClipboardList,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  ArrowUpDown,
  Filter,
} from "lucide-react";

interface SertifikatType {
  id: string;
  sawah: string;
  tipe_hak: string;
  nib: string;
  luas: number;
  url_maps?: string;
  url_bhumi?: string;
}

interface SawahType {
  id: string;
  nama: string;
  luas_total: number;
  lokasi: string;
  harga_sewa: number;
  status: string;
  url_maps?: string;
  deskripsi?: string;
  expand?: {
    "sertifikat(sawah)"?: SertifikatType[];
  };
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

  const [form, setForm] = useState({
    nama: "",
    lokasi: "",
    harga_sewa: "",
    url_maps: "",
    deskripsi: "",
  });

  const [sertifikatList, setSertifikatList] = useState<
    {
      id?: string;
      tipe_hak: string;
      nib: string;
      luas: string;
      url_maps: string;
      url_bhumi: string;
    }[]
  >([
    { tipe_hak: "hak milik", nib: "", luas: "", url_maps: "", url_bhumi: "" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const calculatedTotalLuas = sertifikatList.reduce((sum, cert) => {
    const val = Number(cert.luas);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  async function load() {
    setLoading(true);
    try {
      const sortQuery = sortOrder === "asc" ? "nama" : "-nama";
      const data = await pb.collection("sawah").getFullList<SawahType>({
        sort: sortQuery,
        expand: "sertifikat(sawah)",
      });
      setList(data);
    } catch (err) {
      console.error(err);
      toast("Gagal memuat data sawah.", "error");
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

  function handleAddSertifikatField() {
    setSertifikatList([
      ...sertifikatList,
      { tipe_hak: "hak milik", nib: "", luas: "", url_maps: "", url_bhumi: "" },
    ]);
  }

  function handleRemoveSertifikatField(index: number) {
    if (sertifikatList.length === 1) {
      toast("Minimal harus ada 1 data sertifikat.", "warning");
      return;
    }
    const updated = sertifikatList.filter((_, i) => i !== index);
    setSertifikatList(updated);
  }

  function handleSertifikatChange(index: number, field: string, value: string) {
    const updated = [...sertifikatList];
    updated[index] = { ...updated[index], [field]: value };
    setSertifikatList(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanHarga = form.harga_sewa
      ? form.harga_sewa.replace(/\./g, "")
      : "0";

    const sawahPayload = {
      nama: form.nama,
      luas_total: calculatedTotalLuas,
      lokasi: form.lokasi,
      harga_sewa: Number(cleanHarga),
      url_maps: form.url_maps,
      deskripsi: form.deskripsi,
    };

    try {
      let sawahId = editId;

      if (editId) {
        await pb.collection("sawah").update(editId, sawahPayload);

        const oldSertifikat = await pb.collection("sertifikat").getFullList({
          filter: `sawah="${editId}"`,
        });
        for (const cert of oldSertifikat) {
          await pb.collection("sertifikat").delete(cert.id);
        }
      } else {
        const newSawah = await pb.collection("sawah").create({
          ...sawahPayload,
          status: "tersedia",
        });
        sawahId = newSawah.id;
      }

      for (const cert of sertifikatList) {
        if (!cert.nib) continue;
        await pb.collection("sertifikat").create({
          sawah: sawahId,
          tipe_hak: cert.tipe_hak,
          nib: Number(cert.nib),
          luas: Number(cert.luas || 0),
          url_maps: cert.url_maps,
          url_bhumi: cert.url_bhumi,
        });
      }

      setIsModalOpen(false);
      setForm({
        nama: "",
        lokasi: "",
        harga_sewa: "",
        url_maps: "",
        deskripsi: "",
      });
      setSertifikatList([
        {
          tipe_hak: "hak milik",
          nib: "",
          luas: "",
          url_maps: "",
          url_bhumi: "",
        },
      ]);
      setEditId(null);
      toast(
        editId
          ? "Data sawah & sertifikat berhasil diperbarui!"
          : "Sawah baru berhasil ditambahkan!",
        "success",
      );
      load();
    } catch (err) {
      console.error(err);
      toast("Gagal menyimpan data ke database.", "error");
    }
  }

  function handleDelete(id: string) {
    confirm({
      title: "Hapus Sawah?",
      message:
        "Data sawah beserta seluruh sertifikat terkait akan dihapus permanen.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const certs = await pb
            .collection("sertifikat")
            .getFullList({ filter: `sawah="${id}"` });
          for (const c of certs) {
            await pb.collection("sertifikat").delete(c.id);
          }
          await pb.collection("sawah").delete(id);
          toast("Data sawah berhasil dihapus.", "info");
          load();
        } catch (err) {
          toast("Gagal menghapus sawah karena terikat transaksi.", "error");
        }
      },
    });
  }

  const filteredList = list.filter((s) => {
    const query = searchQuery.toLowerCase();
    const certs = s.expand?.["sertifikat(sawah)"] || [];
    const matchCert = certs.some(
      (c) =>
        c.nib?.toString().includes(query) ||
        c.tipe_hak?.toLowerCase().includes(query),
    );

    const matchSearch =
      s.nama?.toLowerCase().includes(query) ||
      s.lokasi?.toLowerCase().includes(query) ||
      s.deskripsi?.toLowerCase().includes(query) ||
      matchCert;

    const matchStatus = filterStatus === "semua" || s.status === filterStatus;

    return matchSearch && matchStatus;
  });

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
            <Sprout className="text-emerald-500" /> Daftar Aset Sawah &
            Sertifikat
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola petak fisik sawah beserta daftar sertifikat legalitas ganda
            di dalamnya.
          </p>
        </div>
        <button
          onClick={() => {
            setForm({
              nama: "",
              lokasi: "",
              harga_sewa: "",
              url_maps: "",
              deskripsi: "",
            });
            setSertifikatList([
              {
                tipe_hak: "hak milik",
                nib: "",
                luas: "",
                url_maps: "",
                url_bhumi: "",
              },
            ]);
            setEditId(null);
            setIsModalOpen(true);
          }}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm cursor-pointer"
        >
          <Plus size={18} /> Tambah Sawah
        </button>
      </div>

      {/* BARIS PENCARIAN, FILTER & SORTING */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
        {/* Kolom Pencarian Dibuat Lebih Fleksibel */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama, lokasi, atau NIB sertifikat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm"
          />
        </div>

        {/* Filter Status Sawah */}
        <div className="relative w-full md:w-48">
          <Filter className="absolute left-3 top-3 text-slate-400" size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm appearance-none cursor-pointer text-slate-700 font-medium text-sm"
          >
            <option value="semua">Semua Status</option>
            <option value="tersedia">Tersedia</option>
            <option value="disewa">Disewa</option>
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

        {/* Tombol Sorting Nama AtoZ / ZtoA */}
        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <ArrowUpDown size={16} className="text-slate-500" />
          Urutkan: {sortOrder === "asc" ? "A - Z" : "Z - A"}
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          Memuat data sawah...
        </div>
      ) : currentItems.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Belum ada data sawah yang cocok.
        </div>
      ) : (
        <>
          {/* TAMPILAN CARD UNTUK HP (MOBILE) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {currentItems.map((s) => {
              const certs = s.expand?.["sertifikat(sawah)"] || [];
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-base font-bold text-slate-900 block">
                        {s.nama}
                      </span>
                      {s.deskripsi && (
                        <span className="text-xs text-slate-500 block mt-0.5">
                          {s.deskripsi}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${
                        s.status === "tersedia"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {s.status === "tersedia" ? "Tersedia" : "Disewa"}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Luas:</span>
                      <span className="font-bold text-slate-800">
                        {s.luas_total} m²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lokasi:</span>
                      <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">
                        {s.lokasi || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Harga Sewa:</span>
                      <span className="font-bold text-emerald-600">
                        Rp {s.harga_sewa?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Sertifikat Mobile */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Sertifikat ({certs.length}):
                    </span>
                    {certs.length === 0 ? (
                      <span className="text-xs text-amber-600 italic">
                        Belum ada sertifikat terdaftar
                      </span>
                    ) : (
                      certs.map((c, idx) => (
                        <div
                          key={c.id || idx}
                          className="flex flex-wrap items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 gap-1"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                              {c.tipe_hak}
                            </span>
                            <span className="font-semibold text-slate-700">
                              NIB: {c.nib} ({c.luas} m²)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {c.url_maps && (
                              <a
                                href={c.url_maps}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-medium"
                              >
                                Maps <ExternalLink size={10} />
                              </a>
                            )}
                            {c.url_bhumi && (
                              <a
                                href={c.url_bhumi}
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-600 hover:underline inline-flex items-center gap-0.5 font-medium"
                              >
                                Bhumi <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Tombol Aksi Mobile */}
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                    <button
                      onClick={() =>
                        navigate(ROUTES.ADMIN.TRANSAKSI({ q: s.nama }))
                      }
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-200 cursor-pointer"
                    >
                      Transaksi
                    </button>
                    <button
                      onClick={async () => {
                        setForm({
                          nama: s.nama,
                          lokasi: s.lokasi,
                          harga_sewa: formatRupiah(s.harga_sewa),
                          url_maps: s.url_maps || "",
                          deskripsi: s.deskripsi || "",
                        });
                        if (certs.length > 0) {
                          setSertifikatList(
                            certs.map((c) => ({
                              id: c.id,
                              tipe_hak: c.tipe_hak,
                              nib: c.nib.toString(),
                              luas: c.luas.toString(),
                              url_maps: c.url_maps || "",
                              url_bhumi: c.url_bhumi || "",
                            })),
                          );
                        } else {
                          setSertifikatList([
                            {
                              tipe_hak: "hak milik",
                              nib: "",
                              luas: "",
                              url_maps: "",
                              url_bhumi: "",
                            },
                          ]);
                        }
                        setEditId(s.id);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200 cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN TABEL UNTUK DESKTOP / LAYAR BESAR */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Nama Sawah & Legalitas Sertifikat
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Luas & Lokasi
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Harga Sewa
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
                  {currentItems.map((s) => {
                    const certs = s.expand?.["sertifikat(sawah)"] || [];
                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-base">
                            {s.nama}
                          </div>
                          {s.deskripsi && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {s.deskripsi}
                            </p>
                          )}
                          <div className="mt-2 space-y-1.5">
                            {certs.length === 0 ? (
                              <span className="text-xs text-amber-600 italic">
                                Belum ada sertifikat terdaftar
                              </span>
                            ) : (
                              certs.map((c, idx) => (
                                <div
                                  key={c.id || idx}
                                  className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200"
                                >
                                  <span className="uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {c.tipe_hak}
                                  </span>
                                  <span className="font-semibold text-slate-700">
                                    NIB: {c.nib}
                                  </span>
                                  <span className="text-slate-500">
                                    ({c.luas} m²)
                                  </span>
                                  {c.url_maps && (
                                    <a
                                      href={c.url_maps}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                                    >
                                      Maps <ExternalLink size={10} />
                                    </a>
                                  )}
                                  {c.url_bhumi && (
                                    <a
                                      href={c.url_bhumi}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-amber-600 hover:underline inline-flex items-center gap-0.5"
                                    >
                                      Bhumi <ExternalLink size={10} />
                                    </a>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="text-slate-800 font-bold">
                            Total: {s.luas_total} m²
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {s.lokasi || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top font-bold text-emerald-600">
                          Rp {s.harga_sewa?.toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 align-top">
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
                        <td className="px-6 py-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                navigate(ROUTES.ADMIN.TRANSAKSI({ q: s.nama }))
                              }
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Transaksi"
                            >
                              <ClipboardList size={18} />
                            </button>
                            <button
                              onClick={async () => {
                                setForm({
                                  nama: s.nama,
                                  lokasi: s.lokasi,
                                  harga_sewa: formatRupiah(s.harga_sewa),
                                  url_maps: s.url_maps || "",
                                  deskripsi: s.deskripsi || "",
                                });
                                if (certs.length > 0) {
                                  setSertifikatList(
                                    certs.map((c) => ({
                                      id: c.id,
                                      tipe_hak: c.tipe_hak,
                                      nib: c.nib.toString(),
                                      luas: c.luas.toString(),
                                      url_maps: c.url_maps || "",
                                      url_bhumi: c.url_bhumi || "",
                                    })),
                                  );
                                } else {
                                  setSertifikatList([
                                    {
                                      tipe_hak: "hak milik",
                                      nib: "",
                                      luas: "",
                                      url_maps: "",
                                      url_bhumi: "",
                                    },
                                  ]);
                                }
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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

      {/* MODAL FORM TAMBAH / EDIT SAWAH & MULTI SERTIFIKAT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editId
                  ? "Edit Sawah & Sertifikat"
                  : "Tambah Sawah & Sertifikat Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 overflow-y-auto flex-1"
            >
              {/* BAGIAN DATA FISIK SAWAH */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <Sprout size={16} /> Informasi Fisik Petak Sawah
                </h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Sawah / Blok
                  </label>
                  <input
                    required
                    placeholder="Contoh: Blok Plinggisan"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Total Luas Fisik (m²)
                    </label>
                    <input
                      readOnly
                      type="number"
                      value={calculatedTotalLuas}
                      className="w-full px-4 py-2.5 bg-slate-200 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Otomatis terakumulasi dari total luas sertifikat
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Harga Sewa / Musim (Rp)
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="1.500.000"
                      value={form.harga_sewa}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          harga_sewa: formatRupiah(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Lokasi / Keterangan
                    </label>
                    <input
                      placeholder="Desa Sukamaju, RT 02"
                      value={form.lokasi}
                      onChange={(e) =>
                        setForm({ ...form, lokasi: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Iframe Google Maps (
                      <code className="text-xs text-emerald-600">url_maps</code>
                      )
                    </label>
                    <input
                      placeholder='<iframe src="https://..."></iframe>'
                      value={form.url_maps}
                      onChange={(e) =>
                        setForm({ ...form, url_maps: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Deskripsi Sawah
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Deskripsi atau catatan khusus mengenai petak sawah ini..."
                    value={form.deskripsi}
                    onChange={(e) =>
                      setForm({ ...form, deskripsi: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
                  />
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* BAGIAN MULTI SERTIFIKAT HUKUM */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <FileText size={16} /> Daftar Sertifikat Legalitas (Bisa
                    Lebih dari 1)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSertifikatField}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 cursor-pointer"
                  >
                    + Tambah Sertifikat
                  </button>
                </div>

                {sertifikatList.map((cert, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">
                        Sertifikat #{index + 1}
                      </span>
                      {sertifikatList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSertifikatField(index)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                        >
                          Hapus Baris
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Tipe Hak
                        </label>
                        <select
                          value={cert.tipe_hak}
                          onChange={(e) =>
                            handleSertifikatChange(
                              index,
                              "tipe_hak",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700"
                        >
                          <option value="hak milik">Hak Milik</option>
                          <option value="hak guna usaha">Hak Guna Usaha</option>
                          <option value="hak guna bangunan">
                            Hak Guna Bangunan
                          </option>
                          <option value="hak pakai">Hak Pakai</option>
                          <option value="hak wakaf">Hak Wakaf</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          NIB (Nomor Sertifikat)
                        </label>
                        <input
                          required
                          placeholder="Nomor NIB"
                          value={cert.nib}
                          onChange={(e) =>
                            handleSertifikatChange(index, "nib", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Luas (m²)
                        </label>
                        <input
                          required
                          type="number"
                          placeholder="Luas di sertifikat"
                          value={cert.luas}
                          onChange={(e) =>
                            handleSertifikatChange(
                              index,
                              "luas",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Link Google Maps
                        </label>
                        <input
                          placeholder="https://maps.app.goo.gl/..."
                          value={cert.url_maps}
                          onChange={(e) =>
                            handleSertifikatChange(
                              index,
                              "url_maps",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Link Bhumi ATR/BPN
                        </label>
                        <input
                          placeholder="https://bhumi.atrbpn.go.id/..."
                          value={cert.url_bhumi}
                          onChange={(e) =>
                            handleSertifikatChange(
                              index,
                              "url_bhumi",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all cursor-pointer text-sm"
                >
                  Simpan Sawah & Sertifikat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
