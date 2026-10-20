import {
  X,
  Wallet,
  Plus,
  CheckCircle2,
  Calendar,
  Banknote,
  Trash2,
} from "lucide-react";

interface RiwayatBayar {
  id: string;
  nominal: number;
  tanggal: string;
  keterangan: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  payTrx: any;
  payList: RiwayatBayar[];
  payForm: any;
  setPayForm: (form: any) => void;
  onAddPayment: (e: React.FormEvent) => void;
  onDeletePayment: (pay: RiwayatBayar) => void;
  formatRupiah: (val: string | number) => string;
  formatDate: (dateStr: string) => string;
  getTodayString: () => string;
}

export default function PembayaranModal({
  isOpen,
  onClose,
  payTrx,
  payList,
  payForm,
  setPayForm,
  onAddPayment,
  onDeletePayment,
  formatRupiah,
  formatDate,
  getTodayString,
}: Props) {
  if (!isOpen || !payTrx) return null;

  const sisa = payTrx.harga_sewa - (payTrx.nominal_dibayar || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Wallet className="text-emerald-500" /> Riwayat Pembayaran
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Sawah:{" "}
              <span className="font-semibold text-emerald-700">
                {payTrx.expand?.sawah?.nama}
              </span>{" "}
              | Penyewa: {payTrx.expand?.penyewa?.nama}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">
                  Total Harga
                </span>
                <span className="font-bold text-slate-800">
                  Rp {payTrx.harga_sewa.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">
                  Telah Dibayar
                </span>
                <span className="font-bold text-emerald-600">
                  Rp {(payTrx.nominal_dibayar || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-700">
                  SISA TAGIHAN
                </span>
                <span
                  className={`font-black ${sisa > 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  Rp {Math.max(0, sisa).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {sisa > 0 ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
                  <Plus size={16} /> Tambah Cicilan / Bayar
                </h4>
                <form onSubmit={onAddPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Tanggal
                    </label>
                    <input
                      required
                      type="date"
                      min={getTodayString()}
                      value={payForm.tanggal}
                      onChange={(e) =>
                        setPayForm({ ...payForm, tanggal: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Nominal Bayar
                    </label>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      placeholder="Contoh: 500.000"
                      value={payForm.nominal}
                      onChange={(e) =>
                        setPayForm({
                          ...payForm,
                          nominal: formatRupiah(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Keterangan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Cth: Titipan anak, Transfer Bank"
                      value={payForm.keterangan}
                      onChange={(e) =>
                        setPayForm({ ...payForm, keterangan: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors mt-2 cursor-pointer"
                  >
                    Simpan Pembayaran
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-emerald-800 text-sm text-center">
                <CheckCircle2
                  size={32}
                  className="mx-auto mb-2 text-emerald-500"
                />
                <p className="font-bold text-lg mb-1">Sudah Lunas!</p>
                <p>Tidak ada tagihan yang perlu dicicil lagi.</p>
              </div>
            )}
          </div>

          <div className="md:col-span-3 border-t pt-6 md:pt-0 md:border-t-0 md:border-l border-slate-100 md:pl-6">
            <h4 className="font-bold text-slate-800 mb-4 text-sm">
              Daftar Setoran Masuk
            </h4>
            {payList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Banknote size={40} className="mb-2 opacity-50" />
                <p className="text-sm">Belum ada riwayat pembayaran.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payList.map((pay) => (
                  <div
                    key={pay.id}
                    className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Rp {pay.nominal.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {formatDate(pay.tanggal)}
                      </p>
                      {pay.keterangan && (
                        <p className="text-xs text-slate-600 mt-1 italic">
                          "{pay.keterangan}"
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onDeletePayment(pay)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Setoran"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
