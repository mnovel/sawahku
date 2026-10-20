import { useEffect, useState } from "react";
import { X, Copy, Printer } from "lucide-react";
import NotaCard from "./NotaCard";
import { pb } from "../../lib/pb";

interface Props {
  notaTrx: any;
  onClose: () => void;
  onCopyLink: () => void;
}

export default function NotaPreviewModal({
  notaTrx,
  onClose,
  onCopyLink,
}: Props) {
  const [payList, setPayList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPayList() {
      if (!notaTrx?.id) return;
      if (notaTrx.riwayat_bayar && notaTrx.riwayat_bayar.length > 0) {
        setPayList(notaTrx.riwayat_bayar);
        return;
      }
      try {
        const rb = await pb.collection("riwayat_bayar").getFullList({
          filter: `transaksi="${notaTrx.id}"`,
          sort: "tanggal",
        });
        setPayList(rb);
      } catch (err) {
        console.error(err);
      }
    }
    fetchPayList();
  }, [notaTrx]);

  if (!notaTrx) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-200">
        {/* HEADER / ACTION BAR (Tetap di atas, tidak ter-scroll) */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center no-print shrink-0 z-10">
          <span className="font-bold text-slate-800 text-sm">
            Pratinjau Nota Digital
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopyLink}
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              <Copy size={14} /> Salin Link
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
            >
              <Printer size={14} /> Cetak Nota
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* AREA SCROLL KONTEN NOTA */}
        <div className="flex-1 overflow-y-auto bg-slate-100/70 p-4 sm:p-6 flex justify-center items-start">
          <div className="w-full max-w-lg flex justify-center">
            <NotaCard trx={notaTrx} payList={payList} />
          </div>
        </div>
      </div>
    </div>
  );
}
