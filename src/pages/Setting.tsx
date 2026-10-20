import { useEffect, useState } from "react";
import { pb } from "../lib/pb";
import { useNotify } from "../contexts/NotificationContext";
import {
  Settings as SettingsIcon,
  Save,
  Building,
  User,
  Phone,
  MapPin,
  FileText,
  Info,
} from "lucide-react";

export default function Setting() {
  const { toast } = useNotify();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingId, setSettingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nama_aplikasi: "",
    deskripsi: "",
    nama_pengelola: "",
    alamat: "",
    nomor_wa: "",
    catatan_nota: "",
  });

  async function loadSetting() {
    setLoading(true);
    try {
      const records = await pb.collection("setting").getFullList();
      if (records.length > 0) {
        const data = records[0];
        setSettingId(data.id);
        setForm({
          nama_aplikasi: data.nama_aplikasi || "",
          deskripsi: data.deskripsi || "",
          nama_pengelola: data.nama_pengelola || "",
          alamat: data.alamat || "",
          nomor_wa: data.nomor_wa || "",
          catatan_nota: data.catatan_nota || "",
        });
      }
    } catch (err) {
      console.error(err);
      toast("Gagal memuat data pengaturan.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSetting();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (settingId) {
        // Update data setting yang sudah ada
        await pb.collection("setting").update(settingId, form);
      } else {
        // Buat baru jika belum ada record sama sekali
        const newRecord = await pb.collection("setting").create(form);
        setSettingId(newRecord.id);
      }
      toast("Pengaturan aplikasi berhasil diperbarui!", "success");
    } catch (err) {
      console.error(err);
      toast("Gagal menyimpan pengaturan.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-500">
        Memuat pengaturan aplikasi...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="text-emerald-500" /> Pengaturan Aplikasi
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola informasi identitas aplikasi, pengelola, dan format cetak nota
          digital.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-6 sm:p-8 space-y-6">
          {/* INFORMASI APLIKASI */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 mb-4 flex items-center gap-2">
              <Building size={16} /> Identitas Aplikasi & Usaha
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Aplikasi / Usaha
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Sawah App"
                  value={form.nama_aplikasi}
                  onChange={(e) =>
                    setForm({ ...form, nama_aplikasi: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Deskripsi / Slogan Singkat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sistem Informasi Pengelolaan Aset Pertanian"
                  value={form.deskripsi}
                  onChange={(e) =>
                    setForm({ ...form, deskripsi: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* INFORMASI PENGELOLA & KONTAK */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 mb-4 flex items-center gap-2">
              <User size={16} /> Data Pengelola & Kontak
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Pengelola / Pemilik
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-3 text-slate-400"
                    size={18}
                  />
                  <input
                    required
                    type="text"
                    placeholder="Nama lengkap untuk Tanda Tangan Nota"
                    value={form.nama_pengelola}
                    onChange={(e) =>
                      setForm({ ...form, nama_pengelola: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nomor WhatsApp Resmi
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-3 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Contoh: 08123456789"
                    value={form.nomor_wa}
                    onChange={(e) =>
                      setForm({ ...form, nomor_wa: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Alamat / Lokasi Usaha
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-3 text-slate-400"
                  size={18}
                />
                <textarea
                  rows={2}
                  placeholder="Alamat kantor atau lokasi pengelolaan sawah..."
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* CATATAN NOTA */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 mb-4 flex items-center gap-2">
              <FileText size={16} /> Catatan Footer Nota
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Pesan / Catatan Otomatis di Bagian Bawah Nota
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Bukti transaksi sah yang diterbitkan otomatis melalui Sawah App."
                value={form.catatan_nota}
                onChange={(e) =>
                  setForm({ ...form, catatan_nota: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Info size={12} /> Teks ini akan tampil otomatis pada bagian
                paling bawah lembar cetak/digital Nota.
              </p>
            </div>
          </div>
        </div>

        {/* TOMBOL SIMPAN */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-emerald-200 cursor-pointer disabled:opacity-50"
          >
            <Save size={18} /> {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </form>
    </div>
  );
}
