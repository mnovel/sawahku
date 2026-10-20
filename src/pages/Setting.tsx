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
  Image as ImageIcon,
  Globe,
  Search,
} from "lucide-react";

export default function Setting() {
  const { toast } = useNotify();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingId, setSettingId] = useState<string | null>(null);

  // State untuk menangani file logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);

  // State form hanya untuk text fields
  const [form, setForm] = useState({
    nama_aplikasi: "",
    deskripsi_singkat: "",
    deskripsi: "",
    keyword: "",
    nama_pengelola: "",
    alamat: "",
    nomor_wa: "",
    catatan_nota: "",
    domain: "",
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
          deskripsi_singkat: data.deskripsi_singkat || "",
          deskripsi: data.deskripsi || "",
          keyword: data.keyword || "",
          nama_pengelola: data.nama_pengelola || "",
          alamat: data.alamat || "",
          nomor_wa: data.nomor_wa || "",
          catatan_nota: data.catatan_nota || "",
          domain: data.domain || "",
        });

        // Gunakan pb.files.getURL (huruf kapital) untuk menghindari warning
        if (data.logo) {
          setCurrentLogoUrl(pb.files.getURL(data, data.logo));
        }
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
      // Wajib menggunakan FormData karena ada potensi upload file
      const data = new FormData();

      // Append semua text fields dari state form
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
      });

      // Append file logo jika user memilih file baru
      if (logoFile) {
        data.append("logo", logoFile);
      }

      if (settingId) {
        await pb.collection("setting").update(settingId, data);
      } else {
        const newRecord = await pb.collection("setting").create(data);
        setSettingId(newRecord.id);
      }

      toast("Pengaturan aplikasi berhasil diperbarui!", "success");

      // Reset file input dan reload untuk mendapatkan URL logo baru
      setLogoFile(null);
      loadSetting();
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
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="text-emerald-500" /> Pengaturan Aplikasi
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola informasi identitas aplikasi, SEO, pengelola, dan format cetak
          nota digital.
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
              <Building size={16} /> Identitas & SEO Aplikasi
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
                  Domain Utama
                </label>
                <div className="relative">
                  <Globe
                    className="absolute left-3 top-3 text-slate-400"
                    size={18}
                  />
                  <input
                    type="url"
                    placeholder="https://sawahku.com"
                    value={form.domain}
                    onChange={(e) =>
                      setForm({ ...form, domain: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Slogan Singkat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Portal Penyewaan Sawah Pribadi di Pasuruan"
                  value={form.deskripsi_singkat}
                  onChange={(e) =>
                    setForm({ ...form, deskripsi_singkat: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Deskripsi Lengkap (SEO)
                </label>
                <textarea
                  rows={3}
                  placeholder="Informasi dan pengelolaan sewa lahan sawah produktif..."
                  value={form.deskripsi}
                  onChange={(e) =>
                    setForm({ ...form, deskripsi: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Keyword (SEO)
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-3 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="sewa sawah pasuruan, sewa lahan pertanian, ..."
                    value={form.keyword}
                    onChange={(e) =>
                      setForm({ ...form, keyword: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Pisahkan dengan koma (,)
                </p>
              </div>

              {/* Upload Logo (PocketBase File) */}
              <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                  {logoFile ? (
                    // Preview file yang baru dipilih sebelum disave
                    <img
                      src={URL.createObjectURL(logoFile)}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : currentLogoUrl ? (
                    // Tampilkan logo dari PocketBase
                    <img
                      src={currentLogoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="text-slate-300" size={24} />
                  )}
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Logo Aplikasi
                  </label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml, image/webp"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Format: JPG, PNG, SVG, atau WEBP. Biarkan kosong jika tidak
                    ingin mengubah logo.
                  </p>
                </div>
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
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end sticky bottom-0">
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
