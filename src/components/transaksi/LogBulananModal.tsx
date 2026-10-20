import { X, Calendar, Plus, Pencil, FileText, Trash2 } from "lucide-react";
import { pb } from "../../lib/pb";

interface LogBulanan {
  id: string;
  periode: string;
  fase: string;
  keterangan: string;
  foto?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedTrx: any;
  logList: LogBulanan[];
  logForm: any;
  setLogForm: (form: any) => void;
  editLogId: string | null;
  onSaveLog: (e: React.FormEvent) => void;
  onStartEditLog: (log: LogBulanan) => void;
  onCancelEditLog: () => void;
  onDeleteLog: (logId: string) => void;
  getFaseStyle: (fase: string) => any;
}

export default function LogBulananModal({
  isOpen,
  onClose,
  selectedTrx,
  logList,
  logForm,
  setLogForm,
  editLogId,
  onSaveLog,
  onStartEditLog,
  onCancelEditLog,
  onDeleteLog,
  getFaseStyle,
}: Props) {
  if (!isOpen || !selectedTrx) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="text-emerald-500" /> Jurnal Siklus Sawah
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Sawah:{" "}
              <span className="font-semibold text-emerald-700">
                {selectedTrx.expand?.sawah?.nama}
              </span>{" "}
              | Penyewa: {selectedTrx.expand?.penyewa?.nama}
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
          {selectedTrx.status === "aktif" ? (
            <div className="md:col-span-2">
              <div
                className={`p-5 rounded-2xl border sticky top-0 transition-colors ${editLogId ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    {editLogId ? (
                      <>
                        <Pencil size={16} /> Edit Catatan
                      </>
                    ) : (
                      <>
                        <Plus size={16} /> Catat Aktivitas
                      </>
                    )}
                  </h4>
                  {editLogId && (
                    <button
                      type="button"
                      onClick={onCancelEditLog}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-800"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
                <form onSubmit={onSaveLog} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Bulan (Periode)
                    </label>
                    <input
                      required
                      type="month"
                      value={logForm.periode}
                      onChange={(e) =>
                        setLogForm({ ...logForm, periode: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Fase
                    </label>
                    <select
                      value={logForm.fase}
                      onChange={(e) =>
                        setLogForm({ ...logForm, fase: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="tanam">🌾 Tanam</option>
                      <option value="perawatan">💧 Perawatan</option>
                      <option value="panen">🌾 Panen</option>
                      <option value="kosong">⏸️ Kosong</option>
                      <option value="lain">📝 Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Keterangan
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Cth: Padi umur 1 bulan"
                      value={logForm.keterangan}
                      onChange={(e) =>
                        setLogForm({ ...logForm, keterangan: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      {editLogId ? "Ganti Foto (Opsional)" : "Foto (Opsional)"}
                    </label>
                    <input
                      id="foto-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setLogForm({
                          ...logForm,
                          foto: e.target.files ? e.target.files[0] : null,
                        })
                      }
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer"
                    />
                    {editLogId && (
                      <p className="text-xs text-slate-400 mt-1">
                        *Biarkan kosong jika tidak ingin mengganti foto lama.
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className={`w-full py-2.5 text-white rounded-xl text-sm font-bold shadow-sm transition-colors mt-2 cursor-pointer ${editLogId ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
                  >
                    {editLogId ? "Simpan Perubahan" : "Simpan Catatan"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="md:col-span-2">
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-amber-800 text-sm">
                <p className="font-bold mb-1">Transaksi Terkunci</p>
                <p>
                  Transaksi ini sudah berstatus{" "}
                  <strong>
                    {selectedTrx.status === "batal"
                      ? "Dibatalkan"
                      : "Selesai / Panen"}
                  </strong>
                  . Anda tidak dapat menambahkan atau mengedit log lagi.
                </p>
              </div>
            </div>
          )}

          <div
            className={
              selectedTrx.status === "aktif"
                ? "md:col-span-3 pl-2"
                : "md:col-span-3 pl-2 border-l border-slate-100 md:border-l-0"
            }
          >
            <h4 className="font-bold text-slate-800 mb-4 text-sm">
              Riwayat Aktivitas
            </h4>
            {logList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <FileText size={40} className="mb-2 opacity-50" />
                <p className="text-sm">Belum ada catatan.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
                {logList.map((log) => {
                  const style = getFaseStyle(log.fase);
                  return (
                    <div key={log.id} className="relative pl-6">
                      <span
                        className={`absolute -left-[11px] top-1 flex h-5 w-5 items-center justify-center rounded-full ${style.bg} ring-4 ring-white`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${style.color.replace("text-", "bg-")}`}
                        ></span>
                      </span>
                      <div
                        className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${editLogId === log.id ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-200"}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${style.bg} ${style.color}`}
                          >
                            {style.icon} {style.label}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                              <Calendar size={12} /> {log.periode}
                            </span>
                            {selectedTrx.status === "aktif" && (
                              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                                <button
                                  onClick={() => onStartEditLog(log)}
                                  className="text-slate-400 hover:text-amber-600 p-1 cursor-pointer"
                                  title="Edit Log"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => onDeleteLog(log.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                  title="Hapus Log"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {log.foto && (
                          <div className="my-3">
                            <img
                              src={pb.files.getUrl(log, log.foto)}
                              alt="Foto Log"
                              className="w-full max-h-56 object-cover rounded-lg border border-slate-200"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <p className="text-sm text-slate-700 leading-relaxed mt-2">
                          {log.keterangan || (
                            <span className="italic text-slate-400">
                              Tidak ada keterangan tambahan.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
