import { X, CreditCard } from "lucide-react";

interface Sawah {
  id: string;
  nama: string;
  harga_sewa: number;
  status?: string;
}
interface Penyewa {
  id: string;
  nama: string;
  status?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editId: string | null;
  form: any;
  setForm: (form: any) => void;
  availableSawah: Sawah[];
  availablePenyewa: Penyewa[];
  onSubmit: (e: React.FormEvent) => void;
  formatRupiah: (val: string | number) => string;
  getTodayString: () => string;
}

export default function FormTransaksiModal({
  isOpen,
  onClose,
  editId,
  form,
  setForm,
  availableSawah,
  availablePenyewa,
  onSubmit,
  formatRupiah,
  getTodayString,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">
            {editId ? "Edit Transaksi" : "Buat Transaksi Baru"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Pilih Sawah
            </label>
            <select
              required
              value={form.sawah}
              onChange={(e) => {
                const selected = availableSawah.find(
                  (s) => s.id === e.target.value,
                );
                const defaultHarga = selected
                  ? formatRupiah(selected.harga_sewa)
                  : "";
                setForm({
                  ...form,
                  sawah: e.target.value,
                  harga_sewa: defaultHarga,
                  nominal_dibayar:
                    form.status_bayar === "lunas"
                      ? defaultHarga
                      : form.nominal_dibayar,
                });
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Pilih Sawah --</option>
              {availableSawah.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Pilih Penyewa
            </label>
            <select
              required
              value={form.penyewa}
              onChange={(e) => setForm({ ...form, penyewa: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Pilih Penyewa --</option>
              {availablePenyewa.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} {p.status === "nonaktif" ? "(Non-Aktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tanggal Mulai
              </label>
              <input
                required
                type="date"
                value={form.tanggal_mulai}
                onChange={(e) =>
                  setForm({ ...form, tanggal_mulai: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Jatuh Tempo Tagihan
              </label>
              <input
                type="date"
                min={form.tanggal_mulai || getTodayString()}
                value={form.tanggal_jatuh_tempo}
                onChange={(e) =>
                  setForm({ ...form, tanggal_jatuh_tempo: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Harga Sewa (Total)
            </label>
            <input
              required
              type="text"
              inputMode="numeric"
              value={form.harga_sewa}
              onChange={(e) => {
                const newHarga = formatRupiah(e.target.value);
                setForm({
                  ...form,
                  harga_sewa: newHarga,
                  nominal_dibayar:
                    form.status_bayar === "lunas"
                      ? newHarga
                      : form.nominal_dibayar,
                });
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {!editId ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <CreditCard size={16} className="text-emerald-500" /> Status
                  Pembayaran Awal
                </label>
                <select
                  value={form.status_bayar}
                  onChange={(e) => {
                    const status = e.target.value;
                    let nominal = form.nominal_dibayar;
                    if (status === "lunas") nominal = form.harga_sewa;
                    if (status === "belum_bayar") nominal = "";
                    setForm({
                      ...form,
                      status_bayar: status,
                      nominal_dibayar: nominal,
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                >
                  <option value="belum_bayar">Belum Bayar (Rp 0)</option>
                  <option value="dp">DP / Sebagian</option>
                  <option value="lunas">Lunas (Penuh)</option>
                </select>
              </div>

              {form.status_bayar !== "belum_bayar" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nominal Uang Masuk (Rp)
                  </label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    value={form.nominal_dibayar}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nominal_dibayar: formatRupiah(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    disabled={form.status_bayar === "lunas"}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 text-center">
              Untuk menambah atau mengedit riwayat cicilan/pembayaran, gunakan
              fitur <strong>Kelola Pembayaran</strong> (ikon Dompet) di tabel.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 cursor-pointer"
            >
              {editId ? "Simpan Perubahan" : "Mulai Sewa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
