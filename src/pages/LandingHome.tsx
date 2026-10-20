import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ROUTES } from "../routes";
import { pb } from "../lib/pb";
import { useAuth } from "../contexts/AuthContext";
import useSetting from "../hooks/useSetting";
import {
  MapPin,
  Ruler,
  LayoutDashboard,
  LogIn,
  ExternalLink,
  FileText,
  Search,
  CheckCircle2,
  ShieldCheck,
  PhoneCall,
  Sparkles,
  ArrowRight,
  LandPlot,
  X,
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

interface TransaksiType {
  id: string;
  status: string;
  tanggal_mulai: string;
}

export default function LandingHome() {
  const { setting } = useSetting();
  const { user } = useAuth();

  const [list, setList] = useState<SawahType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua"); // "semua" | "tersedia" | "disewa"

  // State untuk Modal Detail Sawah
  const [selectedSawah, setSelectedSawah] = useState<SawahType | null>(null);
  const [transaksiAktif, setTransaksiAktif] = useState<TransaksiType | null>(
    null,
  );
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    async function loadPublicSawah() {
      try {
        const data = await pb.collection("sawah").getFullList<SawahType>({
          sort: "-created",
          expand: "sertifikat(sawah)",
        });
        setList(data);
      } catch (err) {
        console.error("Gagal memuat data sawah:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPublicSawah();
  }, []);

  async function handleOpenDetail(sawah: SawahType) {
    setSelectedSawah(sawah);
    setLoadingModal(true);
    setTransaksiAktif(null);
    try {
      const trxList = await pb
        .collection("transaksi_sewa")
        .getList<TransaksiType>(1, 1, {
          filter: `sawah="${sawah.id}" && status="aktif"`,
        });
      if (trxList.items.length > 0) {
        setTransaksiAktif(trxList.items[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModal(false);
    }
  }

  function formatTanggalIndo(dateString: string) {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  function getEmbedMapUrl(sawah: SawahType) {
    const iframeData = sawah.url_maps;
    if (
      iframeData &&
      (iframeData.includes("iframe") || iframeData.includes("src="))
    ) {
      const match =
        iframeData.match(/src="([^"]+)"/) || iframeData.match(/src='([^']+)'/);
      if (match) return match[1];
    }

    const query = encodeURIComponent(sawah.lokasi || sawah.nama);
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  const filteredList = list.filter((s) => {
    const query = searchQuery.toLowerCase();
    const certs = s.expand?.["sertifikat(sawah)"] || [];
    const matchCert = certs.some(
      (c) =>
        c.nib?.toString().includes(query) ||
        c.tipe_hak?.toLowerCase().includes(query),
    );
    const matchesSearch =
      s.nama?.toLowerCase().includes(query) ||
      s.lokasi?.toLowerCase().includes(query) ||
      s.deskripsi?.toLowerCase().includes(query) ||
      matchCert;

    if (filterStatus === "tersedia")
      return matchesSearch && s.status === "tersedia";
    if (filterStatus === "disewa")
      return matchesSearch && s.status !== "tersedia";
    return matchesSearch;
  });

  const totalLahan = list.length;
  const tersediaCount = list.filter((s) => s.status === "tersedia").length;
  const totalLuas = list.reduce((acc, curr) => acc + (curr.luas_total || 0), 0);

  const pageTitle = setting?.nama_aplikasi
    ? `${setting.nama_aplikasi} - Sewa Sawah & Lahan Pertanian di Pasuruan`
    : "Sewa Sawah di Pasuruan - Sawahku";

  const pageDescription =
    setting?.deskripsi ||
    "Cari dan temukan informasi sewa sawah, lahan pertanian, dan tanah produktif di wilayah Pasuruan secara transparan, lengkap dengan luas, harga, dan lokasi digital.";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* NAVBAR */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm overflow-hidden p-2">
              <img
                src="/favicon.svg"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">
                {setting?.nama_aplikasi || "SAWAHKU"}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 mt-1 block">
                Portal Manajemen Aset Lahan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {setting?.nomor_wa && (
              <a
                href={`https://wa.me/${setting.nomor_wa.replace(/\D/g, "")}?text=Halo%2C%20saya%20tertarik%20dengan%20informasi%20lahan%20sawah.`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-all border border-emerald-200"
              >
                <PhoneCall size={14} /> Hubungi Pengelola
              </a>
            )}

            {user ? (
              <Link
                to={ROUTES.ADMIN.DASHBOARD}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
              >
                <LayoutDashboard size={15} /> Dashboard
              </Link>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                <LogIn size={15} /> Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION MODERN */}
      <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-white py-24 px-6 overflow-hidden">
        {/* Dekorasi Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
            <Sparkles size={14} className="text-emerald-400" /> Platform
            Investasi & Sewa Lahan Pertanian Terpercaya
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Temukan Aset Lahan Produktif Terbaik di{" "}
            <span className="text-emerald-400 underline decoration-emerald-500/40 decoration-wavy">
              Pasuruan
            </span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {pageDescription}
          </p>

          {/* Kotak Pencarian Cantik */}
          <div className="pt-2 max-w-xl mx-auto">
            <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden p-2 bg-white/10 backdrop-blur-md border border-white/20">
              <Search className="absolute left-5 text-emerald-300" size={20} />
              <input
                type="text"
                placeholder="Cari nama sawah, lokasi, atau NIB sertifikat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        {/* STATISTIK DASHBOARD MINI */}
        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 relative z-10 text-center">
          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <p className="text-2xl md:text-3xl font-black text-white">
              {totalLahan}
            </p>
            <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider mt-1">
              Total Aset
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <p className="text-2xl md:text-3xl font-black text-emerald-400">
              {tersediaCount}
            </p>
            <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider mt-1">
              Siap Disewa
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <p className="text-2xl md:text-3xl font-black text-white">
              {totalLuas.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-normal">m²</span>
            </p>
            <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider mt-1">
              Total Luas
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT: LISTING SAWAH */}
      <main className="max-w-7xl mx-auto px-6 py-14 flex-1 w-full">
        {/* HEADER SECTION & FILTER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <LandPlot className="text-emerald-600" /> Daftar Lahan Sawah
              Tersedia
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Pilih petak sawah untuk melihat rincian sertifikat ganda,
              legalitas BPN, dan peta digital.
            </p>
          </div>

          {/* Tombol Filter Cepat */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1.5 rounded-xl border border-slate-300/60 text-xs font-bold">
            <button
              onClick={() => setFilterStatus("semua")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === "semua"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({totalLahan})
            </button>
            <button
              onClick={() => setFilterStatus("tersedia")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === "tersedia"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tersedia ({tersediaCount})
            </button>
            <button
              onClick={() => setFilterStatus("disewa")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === "disewa"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Disewa ({totalLahan - tersediaCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-xs">Memuat data lahan sawah...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <p className="text-slate-600 font-bold text-sm">
              Tidak ada data lahan yang sesuai dengan filter.
            </p>
            <p className="text-xs text-slate-400">
              Coba ubah kata kunci pencarian atau status filter Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((s) => {
              const certs = s.expand?.["sertifikat(sawah)"] || [];
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-slate-200/80 overflow-hidden transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {s.nama}
                        </h3>
                        {s.deskripsi && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {s.deskripsi}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 flex items-center gap-1 ${
                          s.status === "tersedia"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {s.status === "tersedia" ? (
                          <CheckCircle2 size={12} />
                        ) : null}
                        {s.status === "tersedia" ? "Tersedia" : "Disewa"}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-start gap-2.5">
                        <MapPin
                          size={16}
                          className="text-slate-400 shrink-0 mt-0.5"
                        />
                        <span className="line-clamp-2 font-medium">
                          {s.lokasi || "Lokasi belum diatur"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Ruler size={16} className="text-slate-400 shrink-0" />
                        <span>
                          Total Luas:{" "}
                          <strong className="text-slate-900 font-bold">
                            {s.luas_total.toLocaleString("id-ID")} m²
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Ringkasan Sertifikat Di Kartu */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <ShieldCheck size={13} className="text-emerald-600" />{" "}
                        Sertifikat Legal ({certs.length}):
                      </div>
                      {certs.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">
                          Belum ada sertifikat terdaftar
                        </span>
                      ) : (
                        certs.map((c, idx) => (
                          <div
                            key={c.id || idx}
                            className="text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 flex justify-between items-center"
                          >
                            <span className="font-bold uppercase text-emerald-700 text-[11px]">
                              {c.tipe_hak} • NIB {c.nib}
                            </span>
                            <span className="text-slate-500 font-semibold text-[11px]">
                              {c.luas} m²
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Harga Sewa / Musim
                        </p>
                        <p className="text-xl font-black text-emerald-600 mt-0.5">
                          Rp {s.harga_sewa.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Kartu */}
                  <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => handleOpenDetail(s)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                    >
                      Lihat Detail Lengkap <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DETAIL SAWAH */}
      {selectedSawah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 p-2">
                  <img
                    src="/favicon.svg"
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {selectedSawah.nama}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Informasi Detail & Legalitas Multi-Sertifikat
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSawah(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100/80 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        selectedSawah.status === "tersedia"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}
                    >
                      {selectedSawah.status === "tersedia"
                        ? "Tersedia"
                        : "Sedang Disewa"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium mt-1">
                    <MapPin size={15} className="text-slate-400 shrink-0" />{" "}
                    {selectedSawah.lokasi || "Lokasi belum diatur"}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Harga Sewa / Musim
                  </p>
                  <p className="text-2xl font-black text-emerald-600">
                    Rp {selectedSawah.harga_sewa.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {selectedSawah.deskripsi && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600">
                  <span className="font-bold text-slate-800 block mb-1">
                    Deskripsi Lahan:
                  </span>
                  {selectedSawah.deskripsi}
                </div>
              )}

              {/* DAFTAR SERTIFIKAT LENGKAP */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600" /> Daftar
                  Sertifikat Legalitas (
                  {selectedSawah.luas_total.toLocaleString("id-ID")} m² Total)
                </h4>
                <div className="space-y-2.5">
                  {selectedSawah.expand?.["sertifikat(sawah)"]?.map(
                    (cert, idx) => (
                      <div
                        key={cert.id || idx}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 font-bold text-slate-900">
                            <span className="uppercase text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg text-[11px]">
                              {cert.tipe_hak}
                            </span>
                            <span>NIB: {cert.nib}</span>
                            <span className="text-slate-500 font-semibold">
                              ({cert.luas} m²)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {cert.url_maps && (
                            <a
                              href={cert.url_maps}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-bold border border-blue-200 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 text-[11px]"
                            >
                              Maps <ExternalLink size={12} />
                            </a>
                          )}
                          {cert.url_bhumi && (
                            <a
                              href={cert.url_bhumi}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl font-bold border border-amber-200 hover:bg-amber-100 transition-colors inline-flex items-center gap-1 text-[11px]"
                            >
                              Bhumi <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* PETA IFRAME UTAMA */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600" /> Peta Lokasi
                  Sawah (Iframe)
                </h4>
                <div className="w-full h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                  <iframe
                    title={`Peta Lokasi ${selectedSawah.nama}`}
                    src={getEmbedMapUrl(selectedSawah)}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h4 className="font-bold text-slate-900 mb-2.5 text-xs uppercase tracking-wider">
                  Status Penggunaan Saat Ini
                </h4>
                {loadingModal ? (
                  <p className="text-xs text-slate-400">
                    Memeriksa status sewa...
                  </p>
                ) : transaksiAktif ? (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs space-y-1.5 text-amber-900">
                    <p className="font-black text-sm text-amber-800">
                      Status: Sedang Disewa (Aktif)
                    </p>
                    <p className="text-amber-700 font-medium">
                      Mulai Masa Sewa:{" "}
                      <strong className="text-amber-900">
                        {formatTanggalIndo(transaksiAktif.tanggal_mulai)}
                      </strong>
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 font-bold">
                    Lahan ini sedang kosong dan siap untuk disewa.
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
              {setting?.nomor_wa ? (
                <a
                  href={`https://wa.me/${setting.nomor_wa.replace(/\D/g, "")}?text=Halo%2C%20saya%20tertarik%20untuk%20mengetahui%20lebih%20lanjut%20mengenai%20lahan%20*${encodeURIComponent(selectedSawah.nama)}* (${selectedSawah.luas_total} m2).`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                >
                  <PhoneCall size={14} /> Tanya Owner via WhatsApp
                </a>
              ) : (
                <span className="text-xs text-slate-400">
                  Kontak WhatsApp belum diatur.
                </span>
              )}
              <button
                onClick={() => setSelectedSawah(null)}
                className="w-full sm:w-auto px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 pt-12 pb-8 border-t border-slate-800 mt-auto text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 items-start justify-between mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 p-2 shadow-md">
                <img
                  src="/favicon.svg"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-black text-base tracking-tight text-white">
                {setting?.nama_aplikasi || "SAWAHKU"}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm font-normal">
              {pageDescription}
            </p>
          </div>

          <div className="space-y-2.5 text-left">
            <p className="font-bold text-white text-sm tracking-wide">
              Informasi Kontak & Pengelola
            </p>
            <p className="text-slate-200 font-semibold">
              Dikelola oleh {setting?.nama_pengelola || "-"}
            </p>
            {setting?.alamat && (
              <p className="text-slate-400 flex items-start gap-2">
                <MapPin
                  size={16}
                  className="text-emerald-500 shrink-0 mt-0.5"
                />
                <span>{setting.alamat}</span>
              </p>
            )}
            {setting?.nomor_wa && (
              <p className="text-slate-400 flex items-center gap-2">
                <PhoneCall size={16} className="text-emerald-500 shrink-0" />
                <a
                  href={`https://wa.me/${setting.nomor_wa.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors font-bold text-slate-300"
                >
                  {setting.nomor_wa}
                </a>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="font-bold text-white text-sm tracking-wide">
              Lokasi Kantor / Wilayah
            </p>
            <div className="w-full h-36 rounded-2xl overflow-hidden border border-slate-800 shadow-sm bg-slate-800">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d247.14004364199275!2d112.89650515989406!3d-7.657249153164871!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7c5f9873f52e9%3A0x9944007cc7c07a91!2sNotaris%20Nurul%20Fadilah%2C%20S.H.!5e0!3m2!1sen!2sid!4v1792467020603!5m2!1sen!2sid"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Peta Lokasi"
              ></iframe>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-slate-500 text-xs font-medium">
            &copy; {new Date().getFullYear()}{" "}
            {setting?.nama_aplikasi || "Sawahku"}. Hak cipta dilindungi
            undang-undang.
          </p>
        </div>
      </footer>
    </div>
  );
}
