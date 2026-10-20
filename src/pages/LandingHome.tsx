import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes';
import { pb } from '../lib/pb';
import { useAuth } from '../contexts/AuthContext';
import useSetting from '../hooks/useSetting';
import { MapPin, Ruler, LayoutDashboard, LogIn, ExternalLink } from 'lucide-react';

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
  maps_url?: string;
  maps_iframe?: string;
  bhumi?: string;
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
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Modal Detail Sawah
  const [selectedSawah, setSelectedSawah] = useState<SawahType | null>(null);
  const [transaksiAktif, setTransaksiAktif] = useState<TransaksiType | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    async function loadPublicSawah() {
      try {
        const data = await pb.collection('sawah').getFullList<SawahType>({ 
          sort: '-created' 
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
      const trxList = await pb.collection('transaksi_sewa').getList<TransaksiType>(1, 1, {
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
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  function getEmbedMapUrl(sawah: SawahType) {
    const iframeData = sawah.maps_iframe || sawah.maps;
    if (iframeData && (iframeData.includes('iframe') || iframeData.includes('src='))) {
      const match = iframeData.match(/src="([^"]+)"/) || iframeData.match(/src='([^']+)'/);
      if (match) return match[1];
    }

    const urlData = sawah.maps_url || sawah.maps;
    if (urlData && (urlData.includes('goo.gl') || urlData.includes('google.com/maps'))) {
      const query = encodeURIComponent(sawah.lokasi || sawah.nama);
      return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    const query = encodeURIComponent(sawah.lokasi || sawah.nama);
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  const filteredList = list.filter(s => {
    const query = searchQuery.toLowerCase();
    return (
      s.nama?.toLowerCase().includes(query) ||
      s.lokasi?.toLowerCase().includes(query) ||
      s.tipe_hak?.toLowerCase().includes(query)
    );
  });

  const totalLahan = list.length;
  const tersediaCount = list.filter(s => s.status === 'tersedia').length;
  const totalLuas = list.reduce((acc, curr) => acc + (curr.luas_m2 || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* NAVBAR */}
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200 shadow-sm overflow-hidden p-2">
              <img src="/favicon.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">
                {setting?.nama_aplikasi || "SAWAHKU"}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-600 mt-1 block">
                Portal Aset Lahan
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {setting?.nomor_wa && (
              <a
                href={`https://wa.me/${setting.nomor_wa.replace(/\D/g, '')}?text=Halo%2C%20saya%20tertarik%20dengan%20informasi%20lahan%20sawah.`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl text-sm transition-all border border-emerald-200 shadow-xs"
              >
                <svg className="w-4 h-4 fill-emerald-600 shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                Hubungi Pengelola
              </a>
            )}
            
            {user ? (
              <Link
                to={ROUTES.ADMIN.DASHBOARD}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20"
              >
                <LayoutDashboard size={16} /> Buka Dashboard
              </Link>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-slate-900/10"
              >
                <LogIn size={16} /> Login Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white py-20 px-6 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-800/80 text-emerald-200 border border-emerald-700/50 backdrop-blur-sm shadow-inner">
            Dikelola oleh <strong className="text-white font-bold ml-1">{setting?.nama_pengelola || "Admin Sawah"}</strong>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Transparansi & Manajemen <span className="text-emerald-400 underline decoration-emerald-500/40 decoration-wavy">Aset Lahan Sawah</span>
          </h1>
          
          <p className="text-emerald-100/90 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
            {setting?.deskripsi || "Jelajahi daftar aset lahan sawah secara real-time, periksa status ketersediaan, titik lokasi digital, dan legalitas pertanahan dengan mudah."}
          </p>

          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden p-1.5 bg-white/10 backdrop-blur-md border border-white/20">
              <input
                type="text"
                placeholder="Cari berdasarkan nama lahan, lokasi, atau tipe hak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-3.5 bg-transparent text-white placeholder-emerald-200/60 focus:outline-none text-base"
              />
            </div>
          </div>
        </div>

        {/* STATISTIK MINI */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 relative z-10">
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-white">{totalLahan}</p>
            <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider mt-1">Total Aset Lahan</p>
          </div>
          <div className="text-center border-x border-white/10">
            <p className="text-2xl md:text-3xl font-extrabold text-emerald-400">{tersediaCount}</p>
            <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider mt-1">Siap Disewa</p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-white">{totalLuas.toLocaleString('id-ID')} <span className="text-sm font-normal">m²</span></p>
            <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider mt-1">Total Luas</p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT: LISTING SAWAH */}
      <main className="max-w-7xl mx-auto px-6 py-14 flex-1 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              Daftar Lahan Sawah
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Klik <strong className="text-slate-700">"Lihat Detail"</strong> pada kartu untuk melihat informasi lengkap, status sewa, dan peta digital.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-sm">Memuat data lahan sawah...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <p className="text-slate-600 font-medium">Belum ada data lahan sawah yang tersedia atau aturan API PocketBase masih dikunci.</p>
            <p className="text-xs text-slate-400">Pastikan rule "List/Search" pada koleksi 'sawah' di PocketBase sudah diatur agar bisa diakses publik.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((s) => (
              <div 
                key={s.id} 
                className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-slate-200/80 overflow-hidden transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="inline-block uppercase text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 mb-2.5">
                        {s.tipe_hak || 'Hak Milik'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {s.nama}
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 flex items-center gap-1 ${
                      s.status === 'tersedia' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {s.status === 'tersedia' ? 'Tersedia' : 'Disewa'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-sm text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={17} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{s.lokasi || 'Lokasi belum diatur'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Ruler size={17} className="text-slate-400 shrink-0" />
                      <span>Luas Lahan: <strong className="text-slate-800">{s.luas_m2.toLocaleString('id-ID')} m²</strong></span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Harga Sewa / Musim</p>
                      <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                        Rp {s.harga_sewa.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Kartu */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(s.maps_url || s.maps) && (
                      <a 
                        href={s.maps_url || s.maps} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs"
                        title="Buka Google Maps"
                      >
                        Maps
                      </a>
                    )}
                    {s.bhumi && (
                      <a 
                        href={s.bhumi} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-medium border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs"
                        title="Buka Bhumi ATR/BPN"
                      >
                        Bhumi
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenDetail(s)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DETAIL SAWAH */}
      {selectedSawah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
            
            {/* Header Modal */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200 shadow-xs p-2">
                  <img src="/favicon.svg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedSawah.nama}</h3>
                  <p className="text-xs text-slate-500 font-medium">Informasi Detail & Legalitas Aset</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSawah(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Konten Modal */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100/80 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                      selectedSawah.status === 'tersedia' 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {selectedSawah.status === 'tersedia' ? 'Tersedia' : 'Sedang Disewa'}
                    </span>
                    <span className="uppercase text-[10px] font-extrabold text-emerald-900 bg-emerald-200/70 px-2.5 py-0.5 rounded-md">
                      {selectedSawah.tipe_hak || 'Hak Milik'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium mt-1">
                    <MapPin size={15} className="text-slate-400 shrink-0" /> {selectedSawah.lokasi || 'Lokasi belum diatur'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Harga Sewa / Musim</p>
                  <p className="text-2xl font-black text-emerald-600">
                    Rp {selectedSawah.harga_sewa.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                  <Ruler size={16} className="text-emerald-600" /> Spesifikasi & Legalitas Lahan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <span className="text-xs text-slate-400 block font-medium">Luas Lahan</span>
                    <span className="font-bold text-slate-800 text-base">{selectedSawah.luas_m2.toLocaleString('id-ID')} m²</span>
                  </div>
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <span className="text-xs text-slate-400 block font-medium">Nomor Induk Bidang (NIB)</span>
                    <span className="font-bold text-slate-800 text-base">{selectedSawah.nib || '-'}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" /> Peta Lokasi Lahan
                  </h4>
                  <div className="flex gap-2">
                    {(selectedSawah.maps_url || selectedSawah.maps) && (
                      <a 
                        href={selectedSawah.maps_url || selectedSawah.maps} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors inline-flex items-center gap-1"
                      >
                        Buka Maps Luar <ExternalLink size={12} />
                      </a>
                    )}
                    {selectedSawah.bhumi && (
                      <a 
                        href={selectedSawah.bhumi} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors inline-flex items-center gap-1"
                      >
                        Bhumi ATR/BPN <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                {(selectedSawah.maps_iframe || selectedSawah.maps_url || selectedSawah.maps) ? (
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
                ) : (
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 text-xs italic">
                    Tautan atau koordinat Google Maps belum diatur untuk lahan ini.
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h4 className="font-bold text-slate-900 mb-2.5 text-sm">Status Penggunaan Saat Ini</h4>
                {loadingModal ? (
                  <p className="text-xs text-slate-400">Memeriksa status sewa...</p>
                ) : transaksiAktif ? (
                  <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl text-xs space-y-1.5 text-amber-900">
                    <p className="font-bold text-sm text-amber-800">
                      Status: Sedang Disewa (Aktif)
                    </p>
                    <p className="text-amber-700 font-medium">
                      Mulai Masa Sewa: <strong className="text-amber-900">{formatTanggalIndo(transaksiAktif.tanggal_mulai)}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl text-xs text-emerald-800 font-semibold">
                    Lahan ini sedang kosong dan siap untuk disewa.
                  </div>
                )}
              </div>

            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
              {setting?.nomor_wa ? (
                <a
                  href={`https://wa.me/${setting.nomor_wa.replace(/\D/g, '')}?text=Halo%2C%20saya%20tertarik%20untuk%20mengetahui%20lebih%20lanjut%20mengenai%20lahan%20*${encodeURIComponent(selectedSawah.nama)}* (${selectedSawah.luas_m2} m2).`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  Tanya Owner via WhatsApp
                </a>
              ) : (
                <span className="text-xs text-slate-400">Kontak WhatsApp belum diatur.</span>
              )}
              <button
                onClick={() => setSelectedSawah(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 pt-8 pb-6 border-t border-slate-800 mt-auto text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-start justify-between mb-6">
          
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200 p-1.5 shadow-md">
                <img src="/favicon.svg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-sm tracking-tight">{setting?.nama_aplikasi || "SAWAHKU"}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {setting?.deskripsi || "Portal transparansi manajemen aset lahan sawah profesional dan terintegrasi."}
            </p>
          </div>

          <div className="space-y-2 text-left">
            <p className="font-bold text-white text-sm tracking-wide">Informasi Kontak & Pengelola</p>
            <p className="text-slate-300 font-medium">Dikelola oleh {setting?.nama_pengelola || "-"}</p>
            {setting?.alamat && (
              <p className="text-slate-400 flex items-start gap-1.5">
                <MapPin size={15} className="text-slate-500 shrink-0 mt-0.5" /> 
                <span>{setting.alamat}</span>
              </p>
            )}
            {setting?.nomor_wa && (
              <p className="text-slate-400 flex items-center gap-1.5">
                <svg className="w-4 h-4 fill-emerald-500 shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <a href={`https://wa.me/${setting.nomor_wa.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors font-medium text-slate-300">
                  {setting.nomor_wa}
                </a>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="font-bold text-white text-sm tracking-wide">Peta Lokasi</p>
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

        <div className="max-w-7xl mx-auto px-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-xs">&copy; {new Date().getFullYear()} {setting?.nama_aplikasi || "Sawahku"}. Hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}