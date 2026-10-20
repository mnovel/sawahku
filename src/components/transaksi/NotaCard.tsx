import {
  CheckCircle2,
  AlertCircle,
  Sprout,
  User,
  Phone,
  MapPin,
  QrCode,
} from "lucide-react";
import useSetting from "../../hooks/useSetting";

interface RiwayatBayar {
  tanggal: string;
  nominal: number;
  keterangan?: string;
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
  expand?: {
    sawah?: { nama: string; lokasi?: string };
    penyewa?: { nama: string; kontak?: string; alamat?: string };
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
    month: "short",
    year: "numeric",
  });
};

export default function NotaCard({ trx, payList = [] }: Props) {
  const { setting } = useSetting();

  const totalSewa = trx.harga_sewa || 0;
  const totalDibayar = trx.nominal_dibayar || 0;
  const sisaTagihan = Math.max(0, totalSewa - totalDibayar);
  const isLunas = trx.status_bayar === "lunas" || sisaTagihan <= 0;
  const isDP = trx.status_bayar === "dp" && sisaTagihan > 0;

  const trxCode = `TRX-${trx.id.slice(0, 8).toUpperCase()}`;
  const notaUrl = `${window.location.origin}/nota/${trx.id}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    notaUrl,
  )}`;

  return (
    <div
      id="print-section"
      className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8 relative border border-slate-100 print:shadow-none print:border-none print:p-0 print:w-full print:max-w-full"
    >
      {/* STEMPEL STATUS */}
      <div className="absolute top-8 right-8 pointer-events-none select-none print:top-2 print:right-2">
        {isLunas ? (
          <div className="border-4 border-emerald-600/30 text-emerald-600 font-black text-xs uppercase px-3 py-1 rounded-md rotate-[-12deg] tracking-widest flex items-center gap-1 bg-emerald-50/50">
            <CheckCircle2 size={16} /> LUNAS
          </div>
        ) : isDP ? (
          <div className="border-4 border-amber-600/30 text-amber-600 font-black text-xs uppercase px-3 py-1 rounded-md rotate-[-12deg] tracking-widest flex items-center gap-1 bg-amber-50/50">
            <AlertCircle size={16} /> DP / SEBAGIAN
          </div>
        ) : (
          <div className="border-4 border-red-600/30 text-red-600 font-black text-xs uppercase px-3 py-1 rounded-md rotate-[-12deg] tracking-widest flex items-center gap-1 bg-red-50/50">
            <AlertCircle size={16} /> BELUM BAYAR
          </div>
        )}
      </div>

      {/* KOP NOTA */}
      <div className="border-b-2 border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🌾</span>
          <h2 className="text-xl font-black tracking-wider text-emerald-800 uppercase">
            {setting?.nama_aplikasi || "SAWAH APP"}
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          {setting?.alamat || "Kemitraan & Manajemen Penyewaan Lahan Sawah"}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {setting?.deskripsi || "Sistem Informasi Pengelolaan Aset Pertanian"}
          {setting?.nomor_wa ? ` • WA: ${setting.nomor_wa}` : ""}
        </p>
      </div>

      {/* METADATA & QR CODE HEADER */}
      <div className="flex items-center justify-between text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
        <div className="space-y-2">
          <div>
            <p className="text-slate-400 font-medium uppercase text-[10px]">
              No. Transaksi
            </p>
            <p className="font-bold text-slate-800 text-sm tracking-wide">
              #{trxCode}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase text-[10px]">
              Tanggal Cetak
            </p>
            <p className="font-semibold text-slate-700">
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* QR CODE */}
        <div className="flex flex-col items-center justify-center pl-4 border-l border-slate-200">
          <img
            src={qrCodeApiUrl}
            alt={`QR Code ${trxCode}`}
            className="w-16 h-16 rounded border border-slate-200 bg-white p-0.5"
            loading="lazy"
          />
          <span className="text-[9px] font-semibold text-slate-400 mt-1 flex items-center gap-0.5">
            <QrCode size={10} /> Scan Nota
          </span>
        </div>
      </div>

      {/* INFORMASI PENYEWA & SAWAH */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
          <p className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider mb-1.5 flex items-center gap-1">
            <User size={12} /> Penyewa
          </p>
          <p className="font-bold text-slate-800 text-sm">
            {trx.expand?.penyewa?.nama || "-"}
          </p>
          {trx.expand?.penyewa?.kontak && (
            <p className="text-slate-500 mt-0.5 flex items-center gap-1">
              <Phone size={10} /> {trx.expand.penyewa.kontak}
            </p>
          )}
          {trx.expand?.penyewa?.alamat && (
            <p className="text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin size={10} /> {trx.expand.penyewa.alamat}
            </p>
          )}
        </div>

        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
          <p className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider mb-1.5 flex items-center gap-1">
            <Sprout size={12} /> Objek Sewa
          </p>
          <p className="font-bold text-slate-800 text-sm">
            {trx.expand?.sawah?.nama || "-"}
          </p>
          {trx.expand?.sawah?.lokasi && (
            <p className="text-slate-500 mt-0.5">{trx.expand.sawah.lokasi}</p>
          )}
        </div>
      </div>

      {/* PERIODE SEWA */}
      <div className="space-y-2 text-xs mb-6 border-y border-slate-100 py-3">
        <div className="flex justify-between">
          <span className="text-slate-500">Tanggal Mulai Sewa</span>
          <span className="font-semibold text-slate-800">
            {formatDate(trx.tanggal_mulai)}
          </span>
        </div>
        {trx.tanggal_panen && (
          <div className="flex justify-between">
            <span className="text-slate-500">Tanggal Selesai / Panen</span>
            <span className="font-semibold text-slate-800">
              {formatDate(trx.tanggal_panen)}
            </span>
          </div>
        )}
        {trx.tanggal_jatuh_tempo && !isLunas && (
          <div className="flex justify-between">
            <span className="text-slate-500">Jatuh Tempo Tagihan</span>
            <span className="font-bold text-red-600">
              {formatDate(trx.tanggal_jatuh_tempo)}
            </span>
          </div>
        )}
      </div>

      {/* RINCIAN SETORAN / RIWAYAT BAYAR */}
      {payList.length > 0 && (
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2">
            Riwayat Setoran Pembayaran
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="p-2">Tanggal / Keterangan</th>
                  <th className="p-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payList.map((rb, idx) => (
                  <tr key={idx} className="text-slate-600">
                    <td className="p-2">
                      • {formatDate(rb.tanggal)}{" "}
                      {rb.keterangan ? `(${rb.keterangan})` : ""}
                    </td>
                    <td className="p-2 text-right font-medium text-emerald-700">
                      + Rp {rb.nominal.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REKAP BIAYA */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600 font-medium">Total Harga Sewa</span>
          <span className="font-bold text-slate-800">
            Rp {totalSewa.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600 font-medium">Total Terbayar</span>
          <span className="font-bold text-emerald-600">
            Rp {totalDibayar.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <span className="text-xs font-bold text-slate-700">SISA TAGIHAN</span>
          <span
            className={`text-base font-black ${
              sisaTagihan > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            Rp {sisaTagihan.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {trx.keterangan && (
        <div className="mb-6 p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs text-slate-600">
          <p className="font-bold text-amber-900 mb-0.5">Catatan Tambahan:</p>
          <p>{trx.keterangan}</p>
        </div>
      )}

      {/* AREA TANDA TANGAN */}
      <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 mt-6 border-t border-slate-200">
        <div>
          <p className="text-slate-400 mb-12">Penyewa / Penerima</p>
          <p className="font-bold text-slate-800 border-b border-slate-300 pb-1 mx-4">
            {trx.expand?.penyewa?.nama || "Penyewa"}
          </p>
        </div>
        <div>
          <p className="text-slate-400 mb-12">Pengelola / Pemilik Sawah</p>
          <p className="font-bold text-slate-800 border-b border-slate-300 pb-1 mx-4">
            {setting?.nama_pengelola || "Pengelola"}
          </p>
        </div>
      </div>

      {/* FOOTER NOTA */}
      <div className="text-center text-[10px] text-slate-400 mt-6 border-t border-slate-100 pt-3">
        <p>
          {setting?.catatan_nota ||
            `Bukti transaksi sah yang diterbitkan otomatis melalui ${setting?.nama_aplikasi || "Sawah App"}.`}
        </p>
      </div>
    </div>
  );
}
