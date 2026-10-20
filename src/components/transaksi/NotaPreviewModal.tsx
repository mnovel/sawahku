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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-hidden 
      print:static print:bg-white print:backdrop-blur-none print:p-0 print:overflow-visible print:block"
    >
      <div
        className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-slate-300 
        print:h-auto print:max-w-full print:border-none print:shadow-none print:bg-white print:overflow-visible print:block print:rounded-none"
      >
        <div className="px-4 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 z-10 print:hidden">
          <span className="font-bold text-slate-800 text-sm">
            Pratinjau Nota Digital
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onCopyLink}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Copy size={14} /> Salin Link
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Printer size={14} /> Cetak Nota
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-auto bg-slate-200/70 p-4 sm:p-8 flex justify-start md:justify-center items-start min-w-0 
          print:overflow-visible print:h-auto print:p-0 print:bg-white print:block print:m-0"
        >
          <div
            className="w-[210mm] shrink-0 flex justify-center 
            print:w-full print:block print:shrink print:m-0 print:p-0"
          >
            <NotaCard trx={notaTrx} payList={payList} />
          </div>
        </div>
      </div>
    </div>
  );
}
