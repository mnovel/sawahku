import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { pb } from "../lib/pb";
import { Printer, AlertCircle } from "lucide-react";
import NotaCard from "../components/transaksi/NotaCard";

export default function NotaDetail() {
  const { id } = useParams<{ id: string }>();
  const [trx, setTrx] = useState<any>(null);
  const [payList, setPayList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadNota() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await pb
          .collection("transaksi_sewa")
          .getOne(id, { expand: "sawah,penyewa" });
        setTrx(data);

        try {
          const rb = await pb.collection("riwayat_bayar").getFullList({
            filter: `transaksi="${id}"`,
            sort: "tanggal",
          });
          setPayList(rb);
        } catch {}
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadNota();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
        Memuat Nota Digital...
      </div>
    );
  }

  if (error || !trx) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-sm">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">
            Nota Tidak Ditemukan
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Link nota tidak valid atau transaksi sewa telah dihapus.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center">
      {/* BARIS TOMBOL (NO PRINT) */}
      <div className="no-print w-full max-w-lg mb-4 flex justify-between items-center bg-white p-4 rounded-xl shadow-xs">
        <span className="text-xs font-bold text-emerald-700 uppercase">
          Nota Digital Resmi
        </span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
        >
          <Printer size={14} /> Cetak Nota
        </button>
      </div>

      {/* MEMANGGIL NOTACARD TERPUSAT */}
      <NotaCard trx={trx} payList={payList} />
    </div>
  );
}
