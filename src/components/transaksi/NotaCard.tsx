import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Sprout,
  User,
  Phone,
  MapPin,
  Building2,
  FileText,
} from "lucide-react";
import useSetting from "../../hooks/useSetting";
import { pb } from "../../lib/pb";

interface RiwayatBayar {
  tanggal: string;
  nominal: number;
  keterangan?: string;
}

interface SertifikatType {
  id: string;
  tipe_hak: string;
  nib: string;
  luas: number;
  url_maps?: string;
  url_bhumi?: string;
}

interface TransaksiNota {
  id: string;
  tanggal_mulai: string;
  tanggal_panen?: string;
  tanggal_jatuh_tempo?: string;
  harga_sewa: number;
  status: string;
  status_bayar: string;
  nominal_dibayar: number;
  keterangan?: string;
  ttd_penyewa?: string; // <-- TAMBAHKAN INI UNTUK TTD
  expand?: {
    sawah?: {
      id?: string;
      nama: string;
      lokasi?: string;
      luas_total?: number;
    };
    penyewa?: { nama: string; kontak?: string; alamat?: string };
    "sertifikat(sawah)"?: SertifikatType[];
  };
}

interface Props {
  trx: TransaksiNota;
  payList?: RiwayatBayar[];
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const angkaKeTeks = (nilai: number): string => {
  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  if (nilai < 12) return bilangan[nilai];
  if (nilai < 20) return angkaKeTeks(nilai - 10) + " Belas";
  if (nilai < 100)
    return (
      angkaKeTeks(Math.floor(nilai / 10)) + " Puluh " + angkaKeTeks(nilai % 10)
    );
  if (nilai < 200) return "Seratus " + angkaKeTeks(nilai - 100);
  if (nilai < 1000)
    return (
      angkaKeTeks(Math.floor(nilai / 100)) +
      " Ratus " +
      angkaKeTeks(nilai % 100)
    );
  if (nilai < 2000) return "Seribu " + angkaKeTeks(nilai - 1000);
  if (nilai < 1000000)
    return (
      angkaKeTeks(Math.floor(nilai / 1000)) +
      " Ribu " +
      angkaKeTeks(nilai % 1000)
    );
  if (nilai < 1000000000)
    return (
      angkaKeTeks(Math.floor(nilai / 1000000)) +
      " Juta " +
      angkaKeTeks(nilai % 1000000)
    );
  return "";
};

const getTerbilang = (nilai: number) => {
  if (nilai === 0) return "Nol Rupiah";
  return (angkaKeTeks(nilai).replace(/\s+/g, " ").trim() + " Rupiah").replace(
    /\s+/g,
    " ",
  );
};

export default function NotaCard({ trx, payList = [] }: Props) {
  const { setting } = useSetting();
  const [sertifikatList, setSertifikatList] = useState<SertifikatType[]>([]);

  useEffect(() => {
    async function fetchSertifikat() {
      const sawahId = trx.expand?.sawah?.id;
      const expandedCerts = trx.expand?.["sertifikat(sawah)"];

      if (expandedCerts && expandedCerts.length > 0) {
        setSertifikatList(expandedCerts);
        return;
      }
      if (!sawahId) return;

      try {
        const data = await pb
          .collection("sertifikat")
          .getFullList<SertifikatType>({
            filter: `sawah="${sawahId}"`,
          });
        setSertifikatList(data);
      } catch (error) {
        console.error("Gagal mengambil data sertifikat:", error);
      }
    }
    fetchSertifikat();
  }, [trx]);

  const totalSewa = trx.harga_sewa || 0;
  const totalDibayar = trx.nominal_dibayar || 0;
  const sisaTagihan = Math.max(0, totalSewa - totalDibayar);
  const isLunas = trx.status_bayar === "lunas" || sisaTagihan <= 0;
  const isDP = trx.status_bayar === "dp" && sisaTagihan > 0;

  const trxCode = `TRX-${trx.id.slice(0, 8).toUpperCase()}`;
  const notaUrl = `${window.location.origin}/nota/${trx.id}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(notaUrl)}`;

  return (
    <div
      id="print-section"
      className="bg-white rounded-2xl shadow-xl w-full max-w-[210mm] mx-auto min-h-[297mm] p-6 sm:p-8 relative border border-slate-200 print:shadow-none print:border-none print:p-0 print:min-h-0 print:w-full print:max-w-full text-slate-800"
    >
      {/* STEMPEL STATUS */}
      <div className="absolute top-[120px] right-[30px] pointer-events-none select-none print:top-[130px] print:right-[40px] z-50">
        {isLunas ? (
          <div className="border-4 border-emerald-600 text-emerald-600 font-black text-xl uppercase px-6 py-2 rounded-lg rotate-[-12deg] tracking-widest flex items-center gap-2 bg-white shadow-sm">
            <CheckCircle2 size={28} /> LUNAS
          </div>
        ) : isDP ? (
          <div className="border-4 border-amber-600 text-amber-600 font-black text-xl uppercase px-6 py-2 rounded-lg rotate-[-12deg] tracking-widest flex items-center gap-2 bg-white shadow-sm">
            <AlertCircle size={28} /> DP / SEBAGIAN
          </div>
        ) : (
          <div className="border-4 border-red-600 text-red-600 font-black text-xl uppercase px-6 py-2 rounded-lg rotate-[-12deg] tracking-widest flex items-center gap-2 bg-white shadow-sm">
            <AlertCircle size={28} /> BELUM BAYAR
          </div>
        )}
      </div>

      {/* KOP NOTA */}
      <div className="border-b-4 border-slate-800 pb-4 mb-6 flex justify-between items-start relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🌾</span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
              {setting?.nama_aplikasi || "SAWAH APP"}
            </h2>
          </div>
          <p className="text-sm text-slate-600 font-medium">
            {setting?.alamat || "Kemitraan & Manajemen Penyewaan Lahan Sawah"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {setting?.deskripsi ||
              "Sistem Informasi Pengelolaan Aset Pertanian"}
            {setting?.nomor_wa ? ` • Telp/WA: ${setting.nomor_wa}` : ""}
          </p>
        </div>
        <div className="text-right mt-1 relative z-10">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">
            KWITANSI
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            #{trxCode}
          </p>
        </div>
      </div>

      {/* INFORMASI PIHAK & METADATA */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <img
              src={qrCodeApiUrl}
              alt={`QR Code ${trxCode}`}
              className="w-20 h-20 rounded-lg border-2 border-slate-200 bg-white p-1"
              loading="lazy"
              crossOrigin="anonymous"
            />
            <p className="text-[10px] text-center text-slate-500 mt-1 font-medium">
              Scan Validasi
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                Tanggal Cetak
              </p>
              <p className="font-bold text-slate-800">
                {formatDate(new Date().toISOString())}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                Status Dokumen
              </p>
              <p
                className={`font-bold ${isLunas ? "text-emerald-600" : "text-amber-600"}`}
              >
                {isLunas ? "SAH & LUNAS" : "SAH (BELUM LUNAS)"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1">
            <User size={14} /> Ditagihkan Kepada:
          </p>
          <p className="font-bold text-slate-900 text-lg leading-tight">
            {trx.expand?.penyewa?.nama || "-"}
          </p>
          {trx.expand?.penyewa?.kontak && (
            <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
              <Phone size={14} className="text-slate-400" />{" "}
              {trx.expand.penyewa.kontak}
            </p>
          )}
          {trx.expand?.penyewa?.alamat && (
            <p className="text-sm text-slate-600 mt-1 flex items-start gap-1.5">
              <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{trx.expand.penyewa.alamat}</span>
            </p>
          )}
        </div>
      </div>

      {/* DETAIL OBJEK SEWA */}
      <div className="mb-5 relative z-10">
        <h3 className="text-sm font-bold text-slate-800 border-b-2 border-slate-200 pb-2 mb-3 flex items-center gap-2">
          <Sprout size={16} className="text-emerald-600" /> Detail Objek Sewa
        </h3>

        <div className="bg-emerald-50/60 p-3 rounded-t-xl border border-emerald-100 border-b-0 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nama Lahan / Blok
            </p>
            <p className="font-bold text-slate-900 text-base">
              {trx.expand?.sawah?.nama || "-"}
            </p>
            <p className="text-sm text-slate-600 mt-1 flex items-start gap-1">
              <MapPin size={14} className="shrink-0 mt-0.5 text-emerald-600" />
              {trx.expand?.sawah?.lokasi || "Lokasi tidak diatur"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Luas Area Fisik
            </p>
            <p className="font-black text-emerald-700 text-xl">
              {trx.expand?.sawah?.luas_total
                ? `${trx.expand.sawah.luas_total.toLocaleString("id-ID")} m²`
                : "-"}
            </p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-b-xl overflow-hidden bg-white">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-slate-500" /> Rincian
              Legalitas Tanah
            </p>
            <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
              {sertifikatList.length} Dokumen
            </span>
          </div>

          {sertifikatList.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-2 pl-4 font-semibold">Tipe Hak</th>
                  <th className="p-2 font-semibold">Nomor NIB</th>
                  <th className="p-2 font-semibold">Luas</th>
                  <th className="p-2 text-center font-semibold">
                    Tautan Dokumen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sertifikatList.map((cert, idx) => (
                  <tr
                    key={cert.id || idx}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-2 pl-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider border border-emerald-200 text-[10px]">
                        {cert.tipe_hak}
                      </span>
                    </td>
                    <td className="p-2 font-mono font-medium text-slate-700">
                      {cert.nib}
                    </td>
                    <td className="p-2 font-bold text-slate-900">
                      {Number(cert.luas || 0).toLocaleString("id-ID")} m²
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {cert.url_bhumi && (
                          <a
                            href={cert.url_bhumi}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-200 px-2 py-1 rounded text-[10px] font-bold transition-colors"
                          >
                            <FileText size={12} /> Cek BPN
                          </a>
                        )}
                        {cert.url_maps && (
                          <a
                            href={cert.url_maps}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded text-[10px] font-bold transition-colors"
                          >
                            <MapPin size={12} /> Maps
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              Data sertifikat tidak dilampirkan.
            </div>
          )}
        </div>
      </div>

      {/* PERIODE SEWA */}
      <div className="mb-5 relative z-10">
        <h3 className="text-sm font-bold text-slate-800 border-b-2 border-slate-200 pb-2 mb-3 flex items-center gap-2">
          <FileText size={16} className="text-blue-600" /> Periode & Ketentuan
          Sewa
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Mulai Sewa
            </p>
            <p className="font-bold text-slate-800 mt-1">
              {formatDate(trx.tanggal_mulai)}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Selesai / Panen
            </p>
            <p className="font-bold text-slate-800 mt-1">
              {trx.tanggal_panen ? formatDate(trx.tanggal_panen) : "1 Musim"}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Jatuh Tempo
            </p>
            <p
              className={`font-bold mt-1 ${!isLunas && trx.tanggal_jatuh_tempo ? "text-red-600" : "text-slate-800"}`}
            >
              {trx.tanggal_jatuh_tempo
                ? formatDate(trx.tanggal_jatuh_tempo)
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* RINCIAN BIAYA */}
      <div className="mb-5 relative z-10">
        <h3 className="text-sm font-bold text-slate-800 border-b-2 border-slate-200 pb-2 mb-3 flex items-center gap-2">
          <Building2 size={16} className="text-amber-600" /> Rincian Pembayaran
        </h3>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            {payList.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-2 pl-3">Tanggal Setoran</th>
                      <th className="p-2">Keterangan</th>
                      <th className="p-2 text-right pr-3">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {payList.map((rb, idx) => (
                      <tr key={idx} className="text-slate-600">
                        <td className="p-2 pl-3 whitespace-nowrap">
                          {formatDate(rb.tanggal)}
                        </td>
                        <td className="p-2 text-slate-500">
                          {rb.keterangan || "Pembayaran"}
                        </td>
                        <td className="p-2 text-right pr-3 font-bold text-emerald-600">
                          + Rp {rb.nominal.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-4 border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs text-center">
                Belum ada riwayat setoran.
              </div>
            )}
          </div>

          <div className="w-full md:w-[320px]">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">
                  Total Harga Sewa
                </span>
                <span className="font-bold text-slate-800">
                  Rp {totalSewa.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">
                  Total Terbayar
                </span>
                <span className="font-bold text-emerald-600">
                  Rp {totalDibayar.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300 border-dashed">
                <span className="text-sm font-black text-slate-800 uppercase">
                  SISA TAGIHAN
                </span>
                <span
                  className={`text-lg font-black ${sisaTagihan > 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  Rp {sisaTagihan.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="mt-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                Terbilang:
              </p>
              <p className="text-sm font-semibold text-amber-900 italic">
                "{getTerbilang(sisaTagihan > 0 ? sisaTagihan : totalDibayar)}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AREA TANDA TANGAN */}
      <div className="mt-6 pt-4 border-t-2 border-slate-200 grid grid-cols-2 gap-12 text-center text-sm relative z-10">
        <div className="flex flex-col justify-end items-center h-32 relative">
          <p className="text-slate-500 absolute top-0 w-full">
            Penyewa / Penerima
          </p>

          {/* TAMPILKAN TTD JIKA ADA */}
          {trx.ttd_penyewa && (
            <img
              src={trx.ttd_penyewa}
              alt="TTD Penyewa"
              className="h-20 max-w-[80%] object-contain mb-1 relative z-10"
            />
          )}

          <p className="font-bold text-slate-800 border-b border-slate-400 pb-1 mx-8 w-full relative z-20">
            {trx.expand?.penyewa?.nama || "Penyewa"}
          </p>
        </div>

        <div className="flex flex-col justify-end items-center h-32 relative">
          <p className="text-slate-500 absolute top-0 w-full">
            Pengelola / Pemilik Sawah
          </p>
          <p className="font-bold text-slate-800 border-b border-slate-400 pb-1 mx-8 w-full relative z-20">
            {setting?.nama_pengelola || "Pengelola"}
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-[10px] text-slate-400 mt-6 pt-3 border-t border-slate-100 relative z-10">
        <p className="font-semibold text-slate-500 mb-1 uppercase tracking-widest">
          Syarat & Ketentuan
        </p>
        <p className="max-w-2xl mx-auto leading-relaxed">
          1. Kwitansi ini adalah bukti pembayaran yang sah dan diterbitkan
          secara digital oleh sistem {setting?.nama_aplikasi || "Sawah App"}.
          <br />
          2. Harap simpan dokumen ini sebagai bukti kepemilikan hak sewa yang
          sah selama periode berlaku.
        </p>
        <p className="mt-2 font-medium">
          {setting?.catatan_nota ||
            `Dicetak pada ${new Date().toLocaleString("id-ID")}`}
        </p>
      </div>
    </div>
  );
}
