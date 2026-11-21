import { useEffect, useState } from "react";
import { pb } from "../lib/pb";
import { useNotify } from "../contexts/NotificationContext";
import { useSearchParams } from "react-router-dom";
import { ROUTES } from "../routes";
import {
  formatDate,
  formatRupiah,
  getTodayString,
  calculateDuration,
} from "../lib/formatters";
import { getFaseStyle } from "../lib/constants";
import SearchableSelect from "../components/ui/SearchableSelect";
import { sendWATagihan } from "../lib/whatsapp";
import type {
  Sawah,
  Penyewa,
  TransaksiSewa,
  LogBulanan,
  RiwayatBayar,
} from "../types";
import {
  Plus,
  ClipboardList,
  CheckCircle2,
  User,
  Sprout,
  Pencil,
  Ban,
  Search,
  Filter,
  ChevronLeft,
  Calendar,
  ChevronRight,
  Clock,
  Printer,
  Wallet,
  MessageCircle,
  RotateCw,
  ArrowUpDown,
} from "lucide-react";

import FormTransaksiModal from "../components/transaksi/FormTransaksiModal";
import PembayaranModal from "../components/transaksi/PembayaranModal";
import LogBulananModal from "../components/transaksi/LogBulananModal";
import NotaPreviewModal from "../components/transaksi/NotaPreviewModal";
import TandaTanganModal from "../components/transaksi/TandaTanganModal";

// PocketBase menolak field yang tidak dikenal di koleksinya. Pesan errornya
// bisa berbentuk validasi field maupun error SQL, jadi keduanya dicek.
function isFieldJumlahMusimError(err: unknown, field: string): boolean {
  const detail = [
    (err as any)?.message,
    (err as any)?.response?.data
      ? JSON.stringify((err as any).response.data)
      : "",
    String(err ?? ""),
  ].join(" ");
  return new RegExp(field, "i").test(detail);
}

export default function Transaksi() {
  const { toast, confirm } = useNotify();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  // Default "semua" agar transaksi yang baru diselesaikan/dibatalkan tidak
  // langsung hilang dari daftar setelah aksi Selesai/Batalkan.
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterPenyewa, setFilterPenyewa] = useState(
    searchParams.get("penyewa") || "semua",
  );
  const [filterBayar, setFilterBayar] = useState(
    searchParams.get("bayar") || "semua",
  );
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10); // Pilihan data per halaman mirip layout Sawah

  const [list, setList] = useState<TransaksiSewa[]>([]);
  const [sawahList, setSawahList] = useState<Sawah[]>([]);
  const [penyewaList, setPenyewaList] = useState<Penyewa[]>([]);
  const [loading, setLoading] = useState(true);

  // STATE MODALS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    sawah: "",
    penyewa: "",
    tanggal_mulai: "",
    tanggal_jatuh_tempo: "",
    harga_sewa: "",
    jumlah_musim: "1",
    status_bayar: "belum_bayar",
    nominal_dibayar: "",
  });
  const [editId, setEditId] = useState<string | null>(null);

  const [selectedTrx, setSelectedTrx] = useState<TransaksiSewa | null>(null);
  const [logList, setLogList] = useState<LogBulanan[]>([]);
  const [logForm, setLogForm] = useState({
    periode: "",
    fase: "tanam",
    keterangan: "",
    foto: null as File | null,
  });
  const [editLogId, setEditLogId] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [notaTrx, setNotaTrx] = useState<TransaksiSewa | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTrx, setPayTrx] = useState<TransaksiSewa | null>(null);
  const [payList, setPayList] = useState<RiwayatBayar[]>([]);
  const [payForm, setPayForm] = useState({
    tanggal: getTodayString(),
    nominal: "",
    keterangan: "",
  });

  const [isTtdModalOpen, setIsTtdModalOpen] = useState(false);
  const [ttdPenyewa, setTtdPenyewa] = useState<string>("");

  useEffect(() => {
    const q = searchParams.get("q");
    const bayar = searchParams.get("bayar");
    const penyewaId = searchParams.get("penyewa");

    if (q !== null) setSearchQuery(q);
    if (bayar !== null) setFilterBayar(bayar);
    if (penyewaId !== null) setFilterPenyewa(penyewaId);
  }, [searchParams]);

  async function loadData() {
    setLoading(true);
    try {
      const sortQuery =
        sortOrder === "desc" ? "-tanggal_mulai" : "tanggal_mulai";
      const trxData = await pb
        .collection("transaksi_sewa")
        .getFullList<TransaksiSewa>({
          sort: sortQuery,
          expand: "sawah,penyewa",
        });
      const sawahData = await pb.collection("sawah").getFullList<Sawah>();
      const penyewaData = await pb.collection("penyewa").getFullList<Penyewa>();
      setList(trxData);
      setSawahList(sawahData);
      setPenyewaList(penyewaData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPenyewa, filterBayar, itemsPerPage]);

  const filteredList = list.filter((trx) => {
    const keyword = searchQuery.toLowerCase();
    const matchSearch =
      trx.expand?.sawah?.nama?.toLowerCase().includes(keyword) ||
      trx.expand?.penyewa?.nama?.toLowerCase().includes(keyword) ||
      trx.status?.toLowerCase().includes(keyword);

    const matchStatus = filterStatus === "semua" || trx.status === filterStatus;
    const matchPenyewa =
      filterPenyewa === "semua" || trx.expand?.penyewa?.id === filterPenyewa;
    const matchBayar =
      filterBayar === "semua"
        ? true
        : filterBayar === "menunggak"
          ? trx.status_bayar !== "lunas"
          : trx.status_bayar === filterBayar;

    return matchSearch && matchStatus && matchPenyewa && matchBayar;
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;

  // Setelah data dihapus/berubah, halaman aktif bisa melewati jumlah halaman
  // sehingga tabel tampak kosong. Kembalikan ke halaman terakhir yang ada.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredList.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const availablePenyewa = penyewaList.filter(
    (p) => p.status !== "nonaktif" || p.id === form.penyewa,
  );
  const availableSawah = sawahList.filter(
    (s) => s.status === "tersedia" || s.id === form.sawah,
  );

  // Samakan status sawah dengan kondisi transaksi aktifnya. Dipakai setiap
  // kali status transaksi berubah agar status sawah tidak bergantung pada
  // urutan request yang kebetulan berhasil.
  async function syncSawahStatus(sawahId?: string) {
    if (!sawahId) return;
    try {
      const aktif = await pb.collection("transaksi_sewa").getList(1, 1, {
        filter: `sawah="${sawahId}" && status="aktif"`,
      });
      await pb.collection("sawah").update(sawahId, {
        status: aktif.totalItems > 0 ? "disewa" : "tersedia",
      });
    } catch (err) {
      console.error("Gagal menyinkronkan status sawah:", err);
    }
  }

  // Simpan transaksi dengan fallback: bila server belum punya field baru
  // (`penyewa_nama` / `jumlah_musim` karena migrasi belum dijalankan), coba
  // lagi tanpa field tersebut supaya transaksi tetap tersimpan.
  async function simpanTransaksi(
    id: string | null,
    data: Record<string, any>,
  ) {
    const payload: Record<string, any> = { ...data };

    const kirim = () =>
      id
        ? pb.collection("transaksi_sewa").update(id, payload)
        : pb.collection("transaksi_sewa").create(payload);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await kirim();
      } catch (err) {
        if (
          "penyewa_nama" in payload &&
          isFieldJumlahMusimError(err, "penyewa_nama")
        ) {
          console.warn(
            "Field penyewa_nama belum ada di PocketBase; menyimpan tanpa salinan nama penyewa.",
            err,
          );
          delete payload.penyewa_nama;
          continue;
        }

        if (
          "jumlah_musim" in payload &&
          isFieldJumlahMusimError(err, "jumlah_musim")
        ) {
          console.warn(
            "Field jumlah_musim belum ada di PocketBase; menyimpan tanpa jumlah musim.",
            err,
          );
          toast(
            "Field 'jumlah_musim' belum ada di server. Transaksi tetap disimpan tanpa jumlah musim — jalankan migrasi PocketBase.",
            "warning",
          );
          delete payload.jumlah_musim;
          continue;
        }

        throw err;
      }
    }

    throw new Error("Gagal menyimpan transaksi setelah beberapa percobaan.");
  }

  const handleSendWATagihan = (trx: TransaksiSewa) => {
    sendWATagihan(trx, () => {
      toast("Nomor kontak penyewa belum diisi pada data Penyewa!", "warning");
    });
  };

  function openTambahModal() {
    setForm({
      sawah: "",
      penyewa: "",
      tanggal_mulai: getTodayString(),
      tanggal_jatuh_tempo: "",
      harga_sewa: "",
      jumlah_musim: "1",
      status_bayar: "belum_bayar",
      nominal_dibayar: "",
    });
    setTtdPenyewa("");
    setEditId(null);
    setIsModalOpen(true);
  }

  function handleRenewLease(trx: TransaksiSewa) {
    const sawahId = trx.expand?.sawah?.id || "";
    const sawahObj = sawahList.find((s) => s.id === sawahId);
    const defaultHarga = sawahObj
      ? formatRupiah(sawahObj.harga_sewa)
      : formatRupiah(trx.harga_sewa);
    const tglMulai = trx.tanggal_panen
      ? trx.tanggal_panen.split(" ")[0]
      : getTodayString();

    setForm({
      sawah: sawahId,
      penyewa: trx.expand?.penyewa?.id || "",
      tanggal_mulai: tglMulai,
      tanggal_jatuh_tempo: "",
      harga_sewa: defaultHarga,
      jumlah_musim: "1",
      status_bayar: "belum_bayar",
      nominal_dibayar: "",
    });
    // Transaksi perpanjangan adalah kontrak baru, jangan membawa tanda tangan
    // yang tersisa dari transaksi yang sebelumnya diedit.
    setTtdPenyewa("");
    setEditId(null);
    setIsModalOpen(true);
  }

  async function handleSaveTrx(e: React.FormEvent) {
    e.preventDefault();
    const cleanHarga = Number(form.harga_sewa.replace(/\./g, ""));
    const cleanDibayar = Number(form.nominal_dibayar.replace(/\./g, ""));
    const jumlahMusim = Math.floor(Number(form.jumlah_musim) || 1);

    if (!form.sawah || !form.penyewa) {
      return toast("Sawah dan Penyewa wajib dipilih.", "warning");
    }
    if (!Number.isFinite(jumlahMusim) || jumlahMusim < 1) {
      return toast("Jumlah musim minimal 1.", "warning");
    }

    try {
      // 1. Siapkan Payload Dasar
      // Simpan salinan nama penyewa pada transaksi agar nota publik tetap
      // menampilkan nama tanpa perlu membuka data kontak/alamat penyewa.
      const penyewaNama =
        penyewaList.find((p) => p.id === form.penyewa)?.nama ||
        list.find((t) => t.penyewa === form.penyewa)?.expand?.penyewa?.nama ||
        "";

      const payload: any = {
        sawah: form.sawah,
        penyewa: form.penyewa,
        penyewa_nama: penyewaNama,
        tanggal_mulai: form.tanggal_mulai,
        harga_sewa: cleanHarga,
        jumlah_musim: jumlahMusim,
      };

      // 2. Saat membuat transaksi, tanggal hanya dikirim jika diisi. Saat
      //    mengedit, nilai kosong tetap dikirim agar jatuh tempo lama benar-
      //    benar terhapus ketika pengguna menghapus tanggalnya.
      if (editId) {
        payload.tanggal_jatuh_tempo = form.tanggal_jatuh_tempo || "";
      } else if (form.tanggal_jatuh_tempo) {
        payload.tanggal_jatuh_tempo = form.tanggal_jatuh_tempo;
      }

      // 3. Hanya masukkan TTD jika ada isinya
      if (ttdPenyewa) {
        payload.ttd_penyewa = ttdPenyewa;
      }

      if (editId) {
        const oldTrx = list.find((t) => t.id === editId);
        const oldSawahId = oldTrx?.expand?.sawah?.id;

        let newStatusBayar = oldTrx?.status_bayar;
        if (oldTrx && oldTrx.harga_sewa !== cleanHarga) {
          if (oldTrx.nominal_dibayar >= cleanHarga) newStatusBayar = "lunas";
          else if (oldTrx.nominal_dibayar > 0) newStatusBayar = "dp";
          else newStatusBayar = "belum_bayar";
        }

        await simpanTransaksi(editId, {
          ...payload,
          status_bayar: newStatusBayar,
        });

        if (oldTrx?.status === "aktif" && oldSawahId && oldSawahId !== form.sawah) {
          await syncSawahStatus(oldSawahId);
          await syncSawahStatus(form.sawah);
        }
        toast("Transaksi diperbarui!", "success");
      } else {
        // 4. Buat Record Baru. Status bayar diturunkan dari nominal agar tidak
        //    tersimpan status "DP" untuk nominal 0 atau "belum bayar" untuk
        //    nominal penuh.
        const statusBayarBaru: TransaksiSewa["status_bayar"] =
          cleanDibayar <= 0
            ? "belum_bayar"
            : cleanDibayar >= cleanHarga
              ? "lunas"
              : "dp";

        const newTrx = await simpanTransaksi(null, {
          ...payload,
          status: "aktif",
          status_bayar: statusBayarBaru,
          nominal_dibayar: cleanDibayar,
        });

        await syncSawahStatus(form.sawah);

        if (cleanDibayar > 0) {
          await pb.collection("riwayat_bayar").create({
            transaksi: newTrx.id,
            tanggal: form.tanggal_mulai,
            nominal: cleanDibayar,
            keterangan:
              statusBayarBaru === "lunas"
                ? "Pelunasan Awal"
                : "Pembayaran DP Awal",
          });
        }
        toast("Transaksi sewa baru dibuat!", "success");
      }

      setIsModalOpen(false);
      setTtdPenyewa(""); // Reset TTD
      loadData();
    } catch (err: any) {
      // --- PERBAIKAN ERROR HANDLING ---
      console.error("PocketBase Error Data:", err?.response?.data || err);

      let errorMessage = "Gagal menyimpan transaksi.";
      if (err?.response?.data) {
        // Menampilkan field mana yang bermasalah beserta pesan errornya
        const errorDetails = Object.entries(err.response.data)
          .map(([key, val]: any) => `${key}: ${val.message}`)
          .join(", ");
        errorMessage += ` (${errorDetails})`;
      }
      toast(errorMessage, "error");
    }
  }

  function handleBatalSewa(trx: TransaksiSewa) {
    confirm({
      title: "Batalkan Sewa?",
      message: "Data transaksi akan ditandai sebagai batal.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await pb
            .collection("transaksi_sewa")
            .update(trx.id, { status: "batal" });
          await syncSawahStatus(trx.expand?.sawah?.id);
          toast("Sewa dibatalkan.", "info");
          loadData();
        } catch {
          toast("Gagal membatalkan sewa.", "error");
        }
      },
    });
  }

  function handleSelesai(trx: TransaksiSewa) {
    confirm({
      title: "Selesaikan Sewa?",
      message: "Status sawah kembali Tersedia dan transaksi dikunci.",
      onConfirm: async () => {
        try {
          await pb.collection("transaksi_sewa").update(trx.id, {
            status: "selesai",
            tanggal_panen: getTodayString(),
          });
          await syncSawahStatus(trx.expand?.sawah?.id);
          toast("Siklus panen selesai!", "success");
          loadData();
        } catch {
          toast("Gagal menyelesaikan transaksi.", "error");
        }
      },
    });
  }

  function openEditModal(trx: TransaksiSewa) {
    setForm({
      sawah: trx.expand?.sawah?.id || "",
      penyewa: trx.expand?.penyewa?.id || "",
      tanggal_mulai: trx.tanggal_mulai.split(" ")[0],
      tanggal_jatuh_tempo: trx.tanggal_jatuh_tempo
        ? trx.tanggal_jatuh_tempo.split(" ")[0]
        : "",
      harga_sewa: formatRupiah(trx.harga_sewa),
      jumlah_musim: String(trx.jumlah_musim || 1),
      status_bayar: trx.status_bayar,
      nominal_dibayar: formatRupiah(trx.nominal_dibayar || 0),
    });
    // Tampilkan tanda tangan yang sudah tersimpan agar tidak terlihat hilang
    // saat transaksi diedit.
    setTtdPenyewa(trx.ttd_penyewa || "");
    setEditId(trx.id);
    setIsModalOpen(true);
  }

  async function openLogModal(trx: TransaksiSewa) {
    setSelectedTrx(trx);
    setIsLogModalOpen(true);
    const now = new Date();
    setLogForm({
      periode: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      fase: "tanam",
      keterangan: "",
      foto: null,
    });
    setEditLogId(null);
    loadLogs(trx.id);
  }
  async function loadLogs(trxId: string) {
    const logs = await pb.collection("log_bulanan").getFullList<LogBulanan>({
      filter: `transaksi="${trxId}"`,
      sort: "-periode",
    });
    setLogList(logs);
  }
  function startEditLog(log: LogBulanan) {
    setLogForm({
      periode: log.periode,
      fase: log.fase,
      keterangan: log.keterangan || "",
      foto: null,
    });
    setEditLogId(log.id);
  }
  function cancelEditLog() {
    setEditLogId(null);
    const now = new Date();
    setLogForm({
      periode: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      fase: "tanam",
      keterangan: "",
      foto: null,
    });
  }
  function handleDeleteLog(logId: string) {
    confirm({
      title: "Hapus Log Ini?",
      message: "Catatan log dihapus permanen.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await pb.collection("log_bulanan").delete(logId);
          toast("Log dihapus.", "info");
          loadLogs(selectedTrx!.id);
        } catch {
          toast("Gagal menghapus log.", "error");
        }
      },
    });
  }
  async function handleSaveLog(e: React.FormEvent) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("periode", logForm.periode);
      formData.append("fase", logForm.fase);
      formData.append("keterangan", logForm.keterangan);
      if (logForm.foto) formData.append("foto", logForm.foto);
      if (editLogId) {
        await pb.collection("log_bulanan").update(editLogId, formData);
        toast("Log diperbarui.", "success");
      } else {
        formData.append("transaksi", selectedTrx?.id || "");
        await pb.collection("log_bulanan").create(formData);
        toast("Log ditambahkan.", "success");
      }
      cancelEditLog();
      loadLogs(selectedTrx!.id);
    } catch {
      toast("Gagal menyimpan log.", "error");
    }
  }

  async function openPayModal(trx: TransaksiSewa) {
    setPayTrx(trx);
    setIsPayModalOpen(true);
    setPayForm({ tanggal: getTodayString(), nominal: "", keterangan: "" });
    loadRiwayatBayar(trx.id);
  }
  async function loadRiwayatBayar(trxId: string) {
    try {
      const data = await pb
        .collection("riwayat_bayar")
        .getFullList<RiwayatBayar>({
          filter: `transaksi="${trxId}"`,
          sort: "-tanggal",
        });
      setPayList(data);
    } catch (err) {
      console.error(err);
    }
  }
  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payTrx) return;
    const nominalBayar = Number(payForm.nominal.replace(/\./g, ""));
    if (!Number.isFinite(nominalBayar) || nominalBayar <= 0)
      return toast("Nominal tidak valid", "error");

    const sisaTagihan = payTrx.harga_sewa - (payTrx.nominal_dibayar || 0);
    if (nominalBayar > sisaTagihan) {
      return toast(
        `Nominal melebihi sisa tagihan (Rp ${Math.max(0, sisaTagihan).toLocaleString("id-ID")}).`,
        "warning",
      );
    }

    try {
      await pb.collection("riwayat_bayar").create({
        transaksi: payTrx.id,
        tanggal: payForm.tanggal,
        nominal: nominalBayar,
        keterangan: payForm.keterangan || "Pembayaran Termin",
      });

      // Hitung ulang dari riwayat sebagai sumber kebenaran, bukan dari nilai
      // tersimpan yang bisa sudah tidak sinkron.
      const semuaBayar = await pb
        .collection("riwayat_bayar")
        .getFullList<RiwayatBayar>({ filter: `transaksi="${payTrx.id}"` });
      const totalDibayarBaru = semuaBayar.reduce(
        (sum, item) => sum + (item.nominal || 0),
        0,
      );
      const statusBaru: TransaksiSewa["status_bayar"] =
        totalDibayarBaru >= payTrx.harga_sewa ? "lunas" : "dp";

      await pb.collection("transaksi_sewa").update(payTrx.id, {
        nominal_dibayar: totalDibayarBaru,
        status_bayar: statusBaru,
      });
      toast("Pembayaran dicatat!", "success");
      setPayForm({ tanggal: getTodayString(), nominal: "", keterangan: "" });
      setPayTrx({
        ...payTrx,
        nominal_dibayar: totalDibayarBaru,
        status_bayar: statusBaru,
      });
      loadRiwayatBayar(payTrx.id);
      loadData();
    } catch {
      toast("Gagal mencatat pembayaran", "error");
    }
  }
  function handleDeletePayment(pay: RiwayatBayar) {
    confirm({
      title: "Hapus Riwayat Pembayaran?",
      message: "Nominal pembayaran ini akan dikurangi dari total.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await pb.collection("riwayat_bayar").delete(pay.id);

          // Hitung ulang sisa setoran dari riwayat yang masih ada agar total
          // tidak melenceng ketika sebelumnya pernah ada selisih.
          const sisaRiwayat = await pb
            .collection("riwayat_bayar")
            .getFullList<RiwayatBayar>({
              filter: `transaksi="${payTrx!.id}"`,
            });
          const totalDibayarBaru = sisaRiwayat.reduce(
            (sum, item) => sum + (item.nominal || 0),
            0,
          );
          const statusBaru: TransaksiSewa["status_bayar"] =
            totalDibayarBaru <= 0
              ? "belum_bayar"
              : totalDibayarBaru >= payTrx!.harga_sewa
                ? "lunas"
                : "dp";

          await pb.collection("transaksi_sewa").update(payTrx!.id, {
            nominal_dibayar: totalDibayarBaru,
            status_bayar: statusBaru,
          });
          toast("Riwayat pembayaran dihapus.", "info");
          setPayTrx({
            ...payTrx!,
            nominal_dibayar: Math.max(0, totalDibayarBaru),
            status_bayar: statusBaru,
          });
          loadRiwayatBayar(payTrx!.id);
          loadData();
        } catch {
          toast("Gagal menghapus pembayaran", "error");
        }
      },
    });
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="text-emerald-500 shrink-0" /> Transaksi
            Sewa
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Catat penyewaan dan pantau siklus tanam hingga panen.
          </p>
        </div>
        <button
          onClick={openTambahModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-emerald-200 cursor-pointer"
        >
          <Plus size={18} /> Buat Transaksi
        </button>
      </div>

      {/* FILTER, PENCARIAN & SORTING TANGGAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama sawah atau penyewa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-sm"
          />
        </div>

        {/* Filter Penyewa (bisa dicari) */}
        <SearchableSelect
          icon={<User size={20} />}
          value={filterPenyewa}
          onChange={(v) => setFilterPenyewa(v || "semua")}
          emptyLabel="Semua Penyewa"
          placeholder="Semua Penyewa"
          ariaLabel="Filter penyewa"
          options={penyewaList.map((p) => ({ value: p.id, label: p.nama }))}
        />

        {/* Filter Status */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 text-slate-400" size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm appearance-none cursor-pointer text-slate-700 font-medium text-sm"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Sedang Berjalan</option>
            <option value="selesai">Selesai / Panen</option>
            <option value="batal">Dibatalkan</option>
          </select>
          <div className="absolute right-3 top-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>

        {/* Filter Pembayaran */}
        <div className="relative">
          <Wallet className="absolute left-3 top-3 text-slate-400" size={20} />
          <select
            value={filterBayar}
            onChange={(e) => setFilterBayar(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm appearance-none cursor-pointer text-slate-700 font-medium text-sm"
          >
            <option value="semua">Semua Bayar</option>
            <option value="menunggak">Belum Lunas</option>
            <option value="lunas">Lunas</option>
            <option value="dp">DP / Sebagian</option>
            <option value="belum_bayar">Belum Bayar</option>
          </select>
          <div className="absolute right-3 top-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>

        {/* Sorting Tanggal Sewa */}
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 shadow-sm transition-colors cursor-pointer w-full"
        >
          <ArrowUpDown size={16} className="text-slate-500" />
          Tgl Sewa: {sortOrder === "desc" ? "Terbaru" : "Terlama"}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat data...</div>
        ) : (
          <>
            {/* TAMPILAN CARD UNTUK HP (MOBILE) */}
            <div className="grid grid-cols-1 gap-3 p-4 sm:hidden">
              {currentItems.map((trx) => (
                <div
                  key={trx.id}
                  className={`bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 shadow-xs ${trx.status === "batal" ? "opacity-60" : ""}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                        <Sprout
                          size={15}
                          className="text-emerald-500 shrink-0"
                        />{" "}
                        {trx.expand?.sawah?.nama || "Sawah Dihapus"}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                        <User size={13} className="shrink-0 text-slate-400" />{" "}
                        {trx.expand?.penyewa?.nama || "Penyewa Dihapus"}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${trx.status === "aktif" ? "bg-amber-50 text-amber-700 border-amber-200" : trx.status === "selesai" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-300"}`}
                    >
                      {trx.status === "aktif"
                        ? "Berjalan"
                        : trx.status === "selesai"
                          ? "Panen"
                          : "Batal"}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mulai:</span>
                      <span className="font-medium text-slate-800">
                        {formatDate(trx.tanggal_mulai)}
                      </span>
                    </div>
                    {trx.tanggal_jatuh_tempo &&
                      trx.status_bayar !== "lunas" && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Jatuh Tempo:</span>
                          <span className="font-semibold text-red-600">
                            {formatDate(trx.tanggal_jatuh_tempo)}
                          </span>
                        </div>
                      )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Durasi:</span>
                      <span className="font-semibold text-emerald-700">
                        {calculateDuration(
                          trx.tanggal_mulai,
                          trx.tanggal_panen,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jumlah Musim:</span>
                      <span className="font-semibold text-slate-800">
                        {trx.jumlah_musim || 1} Musim
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Harga Sewa:</span>
                      <span className="font-bold text-slate-900">
                        Rp {trx.harga_sewa.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Status Bayar:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          trx.status_bayar === "lunas"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : trx.status_bayar === "dp"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-red-100 text-red-700 border-red-200"
                        }`}
                      >
                        {trx.status_bayar === "belum_bayar"
                          ? "Belum Bayar"
                          : trx.status_bayar === "dp"
                            ? "DP / Sebagian"
                            : "Lunas"}
                      </span>
                    </div>
                    {trx.status_bayar !== "lunas" && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sisa Tagihan:</span>
                        <span className="font-bold text-red-600">
                          Rp{" "}
                          {(
                            trx.harga_sewa - (trx.nominal_dibayar || 0)
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tombol Aksi Mobile */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleRenewLease(trx)}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium border border-indigo-100 flex items-center gap-1 cursor-pointer"
                      title="Perpanjang Sewa"
                    >
                      <RotateCw size={14} /> Perpanjang
                    </button>
                    {trx.status_bayar !== "lunas" && trx.status === "aktif" && (
                      <button
                        onClick={() => handleSendWATagihan(trx)}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium border border-emerald-100 flex items-center gap-1 cursor-pointer"
                        title="Tagih WA"
                      >
                        <MessageCircle size={14} /> Tagih
                      </button>
                    )}
                    <button
                      onClick={() => openPayModal(trx)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium border border-emerald-100 flex items-center gap-1 cursor-pointer"
                      title="Bayar"
                    >
                      <Wallet size={14} /> Bayar
                    </button>
                    <button
                      onClick={() => setNotaTrx(trx)}
                      className="p-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 flex items-center gap-1 cursor-pointer"
                      title="Nota"
                    >
                      <Printer size={14} /> Nota
                    </button>
                    <button
                      onClick={() => openLogModal(trx)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium border border-blue-100 flex items-center gap-1 cursor-pointer"
                      title="Log"
                    >
                      <Calendar size={14} /> Log
                    </button>
                    {trx.status === "aktif" && (
                      <>
                        <button
                          onClick={() => openEditModal(trx)}
                          className="p-2 bg-slate-100 text-blue-600 rounded-lg text-xs font-medium border border-slate-200 cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleSelesai(trx)}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium border border-emerald-200 cursor-pointer"
                          title="Selesai"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <button
                          onClick={() => handleBatalSewa(trx)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200 cursor-pointer"
                          title="Batal"
                        >
                          <Ban size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {currentItems.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {searchQuery ||
                  filterStatus !== "semua" ||
                  filterPenyewa !== "semua" ||
                  filterBayar !== "semua"
                    ? "Tidak ada transaksi yang cocok dengan filter."
                    : "Belum ada transaksi sewa."}
                </div>
              )}
            </div>

            {/* TAMPILAN TABEL UNTUK DESKTOP */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      Sawah & Penyewa
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      Waktu & Durasi
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      Harga & Pembayaran
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      Status Sewa
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {currentItems.map((trx) => (
                    <tr
                      key={trx.id}
                      className={`hover:bg-emerald-50/30 transition-colors group ${
                        trx.status === "batal" ? "opacity-60 bg-slate-50" : ""
                      }`}
                    >
                      {/* KOLOM 1: SAWAH & PENYEWA */}
                      <td className="px-6 py-5 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                            <Sprout size={16} className="text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-base leading-tight group-hover:text-emerald-700 transition-colors">
                              {trx.expand?.sawah?.nama || "Sawah Dihapus"}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                              <User size={12} className="text-slate-400" />
                              {trx.expand?.penyewa?.nama || "Penyewa Dihapus"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* KOLOM 2: TANGGAL & DURASI */}
                      <td className="px-6 py-5 align-top">
                        <div className="font-bold text-slate-800 text-sm">
                          {formatDate(trx.tanggal_mulai)}
                        </div>

                        {trx.tanggal_panen ? (
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Selesai: {formatDate(trx.tanggal_panen)}
                          </div>
                        ) : trx.tanggal_jatuh_tempo &&
                          trx.status_bayar !== "lunas" ? (
                          <div className="text-[11px] text-red-600 font-bold mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> Tempo:{" "}
                            {formatDate(trx.tanggal_jatuh_tempo)}
                          </div>
                        ) : null}

                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                            <Clock size={12} />
                            {trx.status === "aktif"
                              ? "Berjalan "
                              : "Durasi "}{" "}
                            {calculateDuration(
                              trx.tanggal_mulai,
                              trx.tanggal_panen,
                            )}
                          </span>
                        </div>
                      </td>

                      {/* KOLOM 3: HARGA & PEMBAYARAN */}
                      <td className="px-6 py-5 align-top">
                        <div className="text-slate-900 font-black text-base">
                          Rp {trx.harga_sewa.toLocaleString("id-ID")}
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {trx.jumlah_musim || 1} Musim
                          {(trx.jumlah_musim || 1) > 1 && (
                            <>
                              {" "}
                              × Rp{" "}
                              {Math.round(
                                trx.harga_sewa / (trx.jumlah_musim || 1),
                              ).toLocaleString("id-ID")}
                              /musim
                            </>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5 mt-1.5">
                          <span
                            className={`w-fit px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-xs ${
                              trx.status_bayar === "lunas"
                                ? "bg-emerald-500 text-white border-emerald-600"
                                : trx.status_bayar === "dp"
                                  ? "bg-amber-400 text-amber-950 border-amber-500"
                                  : "bg-rose-500 text-white border-rose-600"
                            }`}
                          >
                            {trx.status_bayar === "belum_bayar"
                              ? "Belum Bayar"
                              : trx.status_bayar === "dp"
                                ? "DP / Sebagian"
                                : "Lunas"}
                          </span>

                          {trx.status_bayar !== "lunas" && (
                            <span className="text-[11px] font-semibold text-rose-600">
                              Sisa: Rp{" "}
                              {(
                                trx.harga_sewa - (trx.nominal_dibayar || 0)
                              ).toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* KOLOM 4: STATUS SEWA */}
                      <td className="px-6 py-5 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                            trx.status === "aktif"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : trx.status === "selesai"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              trx.status === "aktif"
                                ? "bg-amber-500 animate-pulse"
                                : trx.status === "selesai"
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                            }`}
                          ></span>
                          {trx.status === "aktif"
                            ? "Berjalan"
                            : trx.status === "selesai"
                              ? "Panen"
                              : "Batal"}
                        </span>
                      </td>

                      {/* KOLOM 5: AKSI */}
                      <td className="px-6 py-5 align-middle text-right">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {/* Kelompok 1: Aksi Utama */}
                          <button
                            onClick={() => openPayModal(trx)}
                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all cursor-pointer shadow-xs"
                            title="Kelola Pembayaran"
                          >
                            <Wallet size={16} />
                          </button>

                          <button
                            onClick={() => openLogModal(trx)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all cursor-pointer shadow-xs"
                            title="Log Bulanan"
                          >
                            <Calendar size={16} />
                          </button>

                          <button
                            onClick={() => setNotaTrx(trx)}
                            className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-700 hover:text-white rounded-xl transition-all cursor-pointer shadow-xs"
                            title="Cetak Nota"
                          >
                            <Printer size={16} />
                          </button>

                          {trx.status_bayar !== "lunas" &&
                            trx.status === "aktif" && (
                              <button
                                onClick={() => handleSendWATagihan(trx)}
                                className="p-2 text-emerald-600 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer shadow-xs"
                                title="Tagih via WhatsApp"
                              >
                                <MessageCircle size={16} />
                              </button>
                            )}

                          {/* Kelompok 2: Aksi Sekunder */}
                          {trx.status === "aktif" && (
                            <>
                              {/* Garis Pemisah yang lebih aman */}
                              <div className="w-[1px] h-5 bg-slate-300 mx-1 shrink-0"></div>

                              <button
                                onClick={() => handleRenewLease(trx)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                                title="Perpanjang Sewa"
                              >
                                <RotateCw size={16} />
                              </button>
                              <button
                                onClick={() => handleSelesai(trx)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                                title="Selesaikan Panen"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                onClick={() => openEditModal(trx)}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleBatalSewa(trx)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                title="Batalkan Sewa"
                              >
                                <Ban size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* PAGINATION MIRIP LAYOUT SAWAH DENGAN PILIHAN ITEMS PER PAGE */}
      {!loading && filteredList.length > 0 && (
        <div className="px-6 py-4 mt-4 border border-slate-200 bg-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">
              Menampilkan{" "}
              <span className="font-semibold text-slate-700">
                {startIndex + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(startIndex + itemsPerPage, filteredList.length)}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-700">
                {filteredList.length}
              </span>{" "}
              transaksi
            </p>

            {/* Pilihan Jumlah Data per Halaman */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 outline-none cursor-pointer shadow-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                  currentPage === index + 1
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* RENDER MODAL */}
      <FormTransaksiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editId={editId}
        form={form}
        setForm={setForm}
        availableSawah={availableSawah}
        availablePenyewa={availablePenyewa}
        onSubmit={handleSaveTrx}
        formatRupiah={formatRupiah}
        getTodayString={getTodayString}
        onOpenTtd={() => setIsTtdModalOpen(true)}
        ttdPenyewa={ttdPenyewa}
      />

      <PembayaranModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        payTrx={payTrx}
        payList={payList}
        payForm={payForm}
        setPayForm={setPayForm}
        onAddPayment={handleAddPayment}
        onDeletePayment={handleDeletePayment}
        formatRupiah={formatRupiah}
        formatDate={formatDate}
        getTodayString={getTodayString}
      />

      <LogBulananModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        selectedTrx={selectedTrx}
        logList={logList}
        logForm={logForm}
        setLogForm={setLogForm}
        editLogId={editLogId}
        onSaveLog={handleSaveLog}
        onStartEditLog={startEditLog}
        onCancelEditLog={cancelEditLog}
        onDeleteLog={handleDeleteLog}
        getFaseStyle={getFaseStyle}
      />

      <NotaPreviewModal
        notaTrx={notaTrx}
        onClose={() => setNotaTrx(null)}
        onCopyLink={() => {
          navigator.clipboard.writeText(
            `${window.location.origin}${ROUTES.NOTA_DETAIL(notaTrx?.id || "")}`,
          );
          toast("Link nota dicopy!", "success");
        }}
      />

      <TandaTanganModal
        isOpen={isTtdModalOpen}
        onClose={() => setIsTtdModalOpen(false)}
        onSave={(base64) => setTtdPenyewa(base64)}
      />
    </div>
  );
}
