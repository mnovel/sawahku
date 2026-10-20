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
  Search,
  CheckCircle2,
  ShieldCheck,
  PhoneCall,
  Sparkles,
  ArrowRight,
  LandPlot,
  X,
  Award,
  BadgeCheck,
} from "lucide-react";

interface SertifikatType {
  id: string;
  sawah: string;
  tipe_hak: string;
  nib: number;
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
    ? `${setting.nama_aplikasi} - ${setting.deskripsi_singkat || "Sewa & Pemasaran Sawah Pribadi"}`
    : "SawahKu - Sewa Sawah di Pasuruan";

  const pageDescription =
    setting?.deskripsi ||
    "Informasi dan pengelolaan sewa lahan sawah produktif milik pribadi di wilayah Pasuruan. Transparan, lengkap dengan rincian luas, legalitas sertifikat, dan peta lokasi.";

  const pageKeywords =
    setting?.keyword ||
    "sewa sawah pasuruan, sewa lahan pertanian, jual beli sawah pasuruan, investasi tanah pertanian, sawahku";

  const currentDomain = setting?.domain || "https://sawahku.com";

  const pageUrl = currentDomain;
  const pageOgImage = setting?.logo ? `${currentDomain}/${setting.logo}` : "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Helmet>
        {/* Standard SEO & Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <meta name="robots" content="index, follow" />
        <meta name="author" content={setting?.nama_aplikasi || "SawahKu"} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href={pageUrl} />

        {/* Open Graph / WhatsApp / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta
          property="og:site_name"
          content={setting?.nama_aplikasi || "SawahKu"}
        />
        <meta property="og:locale" content="id_ID" />
        {pageOgImage && <meta property="og:image" content={pageOgImage} />}

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {pageOgImage && <meta name="twitter:image" content={pageOgImage} />}

        {/* Geo Local SEO Pasuruan */}
        <meta name="geo.region" content="ID-JI" />
        <meta name="geo.placename" content="Pasuruan" />
        <meta name="geo.position" content="-7.6583;112.9261" />
        <meta name="ICBM" content="-7.6583, 112.9261" />

        {/* Structured Data JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "http://schema.org",
            "@type": "WebSite",
            name: setting?.nama_aplikasi || "SawahKu",
            url: pageUrl,
            description: pageDescription,
          })}
        </script>
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
      <section className="relative bg-[#022c22] text-white py-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] bg-white/5 text-emerald-400 border border-white/10 backdrop-blur-md">
            <Sparkles size={14} className="animate-bounce" />{" "}
            {setting?.deskripsi_singkat || "Sewa & Pemasaran Sawah Pribadi"}
          </div>

          <h1 className="text-5xl md:text-7xl font-[900] tracking-tight leading-[1.1] bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
            Kelola & Sewakan <br />
            <span className="text-emerald-400">Aset Sawah Produktif</span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            {pageDescription}
          </p>

          <div className="pt-4 max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-2">
                <Search
                  className="absolute left-6 text-emerald-500"
                  size={24}
                />
                <input
                  type="text"
                  placeholder="Cari lokasi, nama lahan, atau nomor NIB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-transparent text-white placeholder-slate-500 focus:outline-none text-base md:text-lg font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-3 gap-6 relative z-10">
          {[
            {
              label: "Total Aset",
              value: totalLahan,
              suffix: "",
              color: "text-white",
            },
            {
              label: "Siap Disewa",
              value: tersediaCount,
              suffix: "",
              color: "text-emerald-400",
            },
            {
              label: "Total Luas",
              value: totalLuas.toLocaleString("id-ID"),
              suffix: " m²",
              color: "text-white",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-center hover:bg-white/10 transition-colors"
            >
              <p className={`text-2xl md:text-4xl font-black ${stat.color}`}>
                {stat.value}
                <span className="text-sm font-normal opacity-60">
                  {stat.suffix}
                </span>
              </p>
              <p className="text-[10px] text-emerald-500/80 font-black uppercase tracking-[0.15em] mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* MAIN CONTENT: LISTING SAWAH */}
      <main className="max-w-7xl mx-auto px-6 py-14 flex-1 w-full">
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

          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setFilterStatus("semua")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                filterStatus === "semua"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Semua ({totalLahan})
            </button>
            <button
              onClick={() => setFilterStatus("tersedia")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                filterStatus === "tersedia"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Tersedia ({tersediaCount})
            </button>
            <button
              onClick={() => setFilterStatus("disewa")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                filterStatus === "disewa"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredList.map((s) => {
              const certs = s.expand?.["sertifikat(sawah)"] || [];
              return (
                <div
                  key={s.id}
                  className="group bg-white rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 flex flex-col overflow-hidden hover:-translate-y-2"
                >
                  <div className="relative h-32 bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500 rounded-full blur-2xl"></div>
                      <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-teal-500 rounded-full blur-2xl"></div>
                    </div>
                    <LandPlot
                      size={48}
                      className="text-emerald-600/30 group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border backdrop-blur-md shadow-sm ${
                          s.status === "tersedia"
                            ? "bg-emerald-500/90 text-white border-emerald-400"
                            : "bg-amber-500/90 text-white border-amber-400"
                        }`}
                      >
                        {s.status === "tersedia" ? "Tersedia" : "Disewa"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {s.nama}
                      </h3>
                      {s.deskripsi ? (
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {s.deskripsi}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1.5 italic">
                          Tidak ada deskripsi lahan.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 group-hover:border-emerald-100 transition-colors">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">
                          Luas Lahan
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Ruler size={14} className="text-emerald-600" />
                          <span className="text-sm font-black text-slate-800">
                            {s.luas_total.toLocaleString("id-ID")} m²
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 group-hover:border-emerald-100 transition-colors">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">
                          Legalitas
                        </p>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald-600" />
                          <span className="text-sm font-black text-slate-800">
                            {certs.length} Dokumen
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-slate-600 mb-6 px-1">
                      <MapPin size={16} className="text-slate-400 shrink-0" />
                      <span className="line-clamp-2 font-medium">
                        {s.lokasi || "Lokasi belum diatur"}
                      </span>
                    </div>

                    <div className="mt-auto pt-5 border-t border-slate-100 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Harga Sewa
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-emerald-600">
                            Rp {s.harga_sewa.toLocaleString("id-ID")}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            / Musim
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenDetail(s)}
                        className="p-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-emerald-600/20 group/btn cursor-pointer"
                        title="Lihat Detail"
                      >
                        <ArrowRight
                          size={20}
                          className="group-hover/btn:translate-x-1 transition-transform"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DETAIL SAWAH */}
      {selectedSawah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm p-2.5">
                  <img
                    src="/favicon.svg"
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {selectedSawah.nama}
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-black uppercase tracking-wider">
                    Detail Informasi & Legalitas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSawah(null)}
                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all cursor-pointer group"
              >
                <X
                  size={24}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] block mb-2">
                      Lokasi Strategis
                    </span>
                    <p className="text-sm font-bold text-slate-700 flex items-start gap-2">
                      <MapPin
                        size={18}
                        className="text-emerald-500 shrink-0 mt-0.5"
                      />
                      {selectedSawah.lokasi || "Lokasi belum diatur"}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200/50">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        selectedSawah.status === "tersedia"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-amber-100 text-amber-700 border-amber-200"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${selectedSawah.status === "tersedia" ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`}
                      ></div>
                      {selectedSawah.status === "tersedia"
                        ? "Tersedia"
                        : "Disewa"}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                  <span className="text-[10px] font-black text-emerald-100/70 uppercase tracking-[0.2em] block mb-1">
                    Harga Sewa / Musim
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold opacity-80">Rp</span>
                    <span className="text-3xl font-black tracking-tight">
                      {selectedSawah.harga_sewa.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-3 py-1.5 rounded-xl border border-white/10">
                    <CheckCircle2 size={12} /> Harga All-in & Transparan
                  </div>
                </div>
              </div>

              {selectedSawah.deskripsi && (
                <div className="space-y-3">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2 px-1">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                    Deskripsi Lahan
                  </h4>
                  <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedSawah.deskripsi}
                  </div>
                </div>
              )}
              {/* BAGIAN SERTIFIKAT */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                    Legalitas Sertifikat
                  </h4>
                  <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full shadow-sm">
                    Total Luas:{" "}
                    {selectedSawah.luas_total.toLocaleString("id-ID")} m²
                  </span>
                </div>

                <div className="grid gap-4">
                  {!selectedSawah.expand?.["sertifikat(sawah)"] ||
                  (selectedSawah.expand["sertifikat(sawah)"] || []).length ===
                    0 ? (
                    <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-300 text-center">
                      <p className="text-xs text-slate-400 font-bold">
                        Belum ada data sertifikat digital.
                      </p>
                    </div>
                  ) : (
                    (selectedSawah.expand?.["sertifikat(sawah)"] || []).map(
                      (cert, idx) => (
                        <div
                          key={cert.id || idx}
                          className="bg-white rounded-[2rem] border border-slate-200 p-5 hover:border-emerald-500/50 transition-all group relative overflow-hidden shadow-sm hover:shadow-md"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-colors"></div>

                          <div className="relative z-10">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                                <BadgeCheck size={14} /> {cert.tipe_hak}
                              </span>
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-xl border border-slate-200">
                                NIB: {cert.nib}
                              </span>
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1.5 rounded-xl border border-blue-100 ml-auto">
                                {cert.luas} m²
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <a
                                href={cert.url_maps || "#"}
                                target={cert.url_maps ? "_blank" : undefined}
                                rel="noopener noreferrer"
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-black transition-all ${
                                  cert.url_maps
                                    ? "bg-slate-900 text-white hover:bg-emerald-600 shadow-md"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                }`}
                              >
                                <MapPin size={14} /> Lokasi Maps
                              </a>
                              <a
                                href={cert.url_bhumi || "#"}
                                target={cert.url_bhumi ? "_blank" : undefined}
                                rel="noopener noreferrer"
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-black transition-all ${
                                  cert.url_bhumi
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                }`}
                              >
                                <Award size={14} /> Cek Bhumi BPN
                              </a>
                            </div>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>

              {/* Peta Iframe */}
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2 px-1">
                  <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div>
                  Visualisasi Lokasi
                </h4>
                <div className="w-full h-64 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 relative group">
                  <iframe
                    title={`Peta Lokasi ${selectedSawah.nama}`}
                    src={getEmbedMapUrl(selectedSawah)}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale-[20%] contrast-[110%] group-hover:grayscale-0 transition-all duration-700"
                  ></iframe>
                </div>
              </div>

              {/* Status Transaksi Aktif */}
              <div className="pt-2">
                {loadingModal ? (
                  <div className="flex items-center gap-2 text-slate-400 animate-pulse">
                    <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
                    <span className="text-[10px] font-bold">
                      Sinkronisasi status terkini...
                    </span>
                  </div>
                ) : selectedSawah.status !== "tersedia" || transaksiAktif ? (
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-[2rem] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-0.5">
                        Lahan Sedang Disewa
                      </p>
                      <p className="text-xs font-bold text-amber-900">
                        {transaksiAktif?.tanggal_mulai
                          ? `Mulai Masa Sewa: ${formatTanggalIndo(transaksiAktif.tanggal_mulai)}`
                          : "Status lahan saat ini tercatat sedang disewa/tidak tersedia."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[2rem] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">
                        Status Lahan Kosong
                      </p>
                      <p className="text-xs font-bold text-emerald-900">
                        Siap untuk disewakan kepada Anda sekarang juga.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Hubungi Pemilik
                </p>
                <p className="text-xs font-bold text-slate-600">
                  {setting?.nama_pengelola || "Pengelola SawahKu"}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {setting?.nomor_wa && (
                  <a
                    href={`https://wa.me/${setting.nomor_wa.replace(/\D/g, "")}?text=Halo%2C%20saya%20tertarik%20untuk%20mengetahui%20lebih%20lanjut%20mengenai%20lahan%20*${encodeURIComponent(selectedSawah.nama)}* (${selectedSawah.luas_total} m2).`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                  >
                    <PhoneCall size={16} /> Tanya via WhatsApp
                  </a>
                )}
                <button
                  onClick={() => setSelectedSawah(null)}
                  className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-600 rounded-2xl font-black text-xs transition-all border border-slate-200 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
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
            <p className="font-bold text-sm tracking-tight text-slate-300">
              {setting?.deskripsi_singkat || "SAWAHKU"}
            </p>
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
            {setting?.nama_aplikasi || "SawahKu"}.
          </p>
        </div>
      </footer>
    </div>
  );
}
