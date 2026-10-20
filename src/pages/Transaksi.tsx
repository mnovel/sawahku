import { useEffect, useState } from "react";
import { pb } from "../lib/pb";
import { useNotify } from "../contexts/NotificationContext";
import { useSearchParams } from "react-router-dom";
import { ROUTES } from "../routes";
import {
  Plus,
  ClipboardList,
  CheckCircle2,
  User,
  Sprout,
  Droplets,
  Wheat,
  PauseCircle,
  FileText,
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
} from "lucide-react";

import FormTransaksiModal from "../components/transaksi/FormTransaksiModal";
import PembayaranModal from "../components/transaksi/PembayaranModal";
import LogBulananModal from "../components/transaksi/LogBulananModal";
import NotaPreviewModal from "../components/transaksi/NotaPreviewModal";

interface Sawah {
  id: string;
  nama: string;
  harga_sewa: number;
  status?: string;
}
interface Penyewa {
  id: string;
  nama: string;
  kontak?: string;
  status?: string;
}
interface Transaksi {
  id: string;
  expand?: { sawah: Sawah; penyewa: Penyewa };
  tanggal_mulai: string;
  tanggal_panen: string;
  tanggal_jatuh_tempo?: string;
  harga_sewa: number;
  status: string;
  status_bayar: string;
  nominal_dibayar: number;
}
interface LogBulanan {
  id: string;
  periode: string;
  fase: string;
  keterangan: string;
  foto?: string;
}
interface RiwayatBayar {
  id: string;
  nominal: number;
  tanggal: string;
  keterangan: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
const formatRupiah = (val: number | string) => {
  const numStr = val.toString().replace(/\D/g, "");
  if (!numStr) return "";
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const formatWA = (phone: string) => {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
  return cleaned;
};
const calculateDuration = (startDateStr: string, endDateStr: string | null) => {
  if (!startDateStr) return "-";
  const start = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : new Date();
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  let days = end.getDate() - start.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) return "0 Hari";
  const parts = [];
  if (months > 0) parts.push(`${months} bln`);
  if (days > 0 || parts.length === 0) parts.push(`${days} hr`);
  return parts.join(" ");
};

const getFaseStyle = (fase: string) => {
  switch (fase) {
    case "tanam":
      return {
        color: "text-emerald-600",
        bg: "bg-emerald-100",
        border: "border-emerald-200",
        icon: <Sprout size={16} />,
        label: "Tanam",
      };
    case "perawatan":
      return {
        color: "text-blue-600",
        bg: "bg-blue-100",
        border: "border-blue-200",
        icon: <Droplets size={16} />,
        label: "Perawatan",
      };
    case "panen":
      return {
        color: "text-amber-600",
        bg: "bg-amber-100",
        border: "border-amber-200",
        icon: <Wheat size={16} />,
        label: "Panen",
      };
    case "kosong":
      return {
        color: "text-slate-500",
        bg: "bg-slate-100",
        border: "border-slate-200",
        icon: <PauseCircle size={16} />,
        label: "Kosong",
      };
    default:
      return {
        color: "text-purple-600",
        bg: "bg-purple-100",
        border: "border-purple-200",
        icon: <FileText size={16} />,
        label: "Lainnya",
      };
  }
};

export default function Transaksi() {
  const { toast, confirm } = useNotify();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filterStatus, setFilterStatus] = useState("aktif");
  const [filterPenyewa, setFilterPenyewa] = useState(
    searchParams.get("penyewa") || "semua",
  );
  const [filterBayar, setFilterBayar] = useState(
    searchParams.get("bayar") || "semua",
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const [list, setList] = useState<Transaksi[]>([]);
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
    status_bayar: "belum_bayar",
    nominal_dibayar: "",
  });
  const [editId, setEditId] = useState<string | null>(null);

  const [selectedTrx, setSelectedTrx] = useState<Transaksi | null>(null);
  const [logList, setLogList] = useState<LogBulanan[]>([]);
  const [logForm, setLogForm] = useState({
    periode: "",
    fase: "tanam",
    keterangan: "",
    foto: null as File | null,
  });
  const [editLogId, setEditLogId] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [notaTrx, setNotaTrx] = useState<Transaksi | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTrx, setPayTrx] = useState<Transaksi | null>(null);
  const [payList, setPayList] = useState<RiwayatBayar[]>([]);
  const [payForm, setPayForm] = useState({
    tanggal: getTodayString(),
    nominal: "",
    keterangan: "",
  });

  // Sinkronisasi parameter URL ketika navigasi dari halaman lain berubah
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
      const trxData = await pb
        .collection("transaksi_sewa")
        .getFullList<Transaksi>({ sort: "-created", expand: "sawah,penyewa" });
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
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPenyewa, filterBayar, limit]);

  const filteredList = list.filter((trx) => {
    const keyword = searchQuery.toLowerCase();
    const matchSearch =
      trx.expand?.sawah?.nama?.toLowerCase().includes(keyword) ||
      trx.expand?.penyewa?.nama?.toLowerCase().includes(keyword) ||
      trx.status?.toLowerCase().includes(keyword);

    const matchStatus = filterStatus === "semua" || trx.status === filterStatus;

    // Filter berdasarkan ID penyewa yang dikirim via URL / Pilihan Dropdown
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

  const indexOfLastItem = currentPage * limit;
  const indexOfFirstItem = indexOfLastItem - limit;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / limit);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const availablePenyewa = penyewaList.filter(
    (p) => p.status !== "nonaktif" || p.id === form.penyewa,
  );
  const availableSawah = sawahList.filter(
    (s) => s.status === "tersedia" || s.id === form.sawah,
  );

  const sendWATagihan = (trx: Transaksi) => {
    const penyewaNama = trx.expand?.penyewa?.nama || "Penyewa";
    const sawahNama = trx.expand?.sawah?.nama || "Sawah";
    const kontak = trx.expand?.penyewa?.kontak || "";
    const sisa = trx.harga_sewa - (trx.nominal_dibayar || 0);
    const jatuhTempo = trx.tanggal_jatuh_tempo
      ? formatDate(trx.tanggal_jatuh_tempo)
      : "-";
    const linkNota = `${window.location.origin}${ROUTES.NOTA_DETAIL(trx.id)}`;

    if (!kontak)
      return toast(
        "Nomor kontak penyewa belum diisi pada data Penyewa!",
        "warning",
      );

    const pesan =
      `Halo Bp/Ibu *${penyewaNama}*,\n\n` +
      `Sekadar mengingatkan mengenai tagihan sewa sawah *${sawahNama}*.\n\n` +
      `• Total Sewa: Rp ${trx.harga_sewa.toLocaleString("id-ID")}\n` +
      `• Terbayar: Rp ${(trx.nominal_dibayar || 0).toLocaleString("id-ID")}\n` +
      `• *Sisa Tagihan: Rp ${sisa.toLocaleString("id-ID")}*\n` +
      `• Tanggal Jatuh Tempo: *${jatuhTempo}*\n\n` +
      `Rincian nota digital dapat diakses melalui link berikut:\n${linkNota}\n\n` +
      `Terima kasih. 🙏`;

    window.open(
      `https://wa.me/${formatWA(kontak)}?text=${encodeURIComponent(pesan)}`,
      "_blank",
    );
  };

  function openTambahModal() {
    setForm({
      sawah: "",
      penyewa: "",
      tanggal_mulai: getTodayString(),
      tanggal_jatuh_tempo: "",
      harga_sewa: "",
      status_bayar: "belum_bayar",
      nominal_dibayar: "",
    });
    setEditId(null);
    setIsModalOpen(true);
  }

  function handleRenewLease(trx: Transaksi) {
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
      status_bayar: "belum_bayar",
      nominal_dibayar: "",
    });
    setEditId(null);
    setIsModalOpen(true);
  }

  async function handleSaveTrx(e: React.FormEvent) {
    e.preventDefault();
    const cleanHarga = Number(form.harga_sewa.replace(/\./g, ""));
    const cleanDibayar = Number(form.nominal_dibayar.replace(/\./g, ""));

    try {
      if (editId) {
        const oldTrx = list.find((t) => t.id === editId);
        const oldSawahId = oldTrx?.expand?.sawah?.id;
        let newStatusBayar = oldTrx?.status_bayar;
        if (oldTrx && oldTrx.harga_sewa !== cleanHarga) {
          if (oldTrx.nominal_dibayar >= cleanHarga) newStatusBayar = "lunas";
          else if (oldTrx.nominal_dibayar > 0) newStatusBayar = "dp";
          else newStatusBayar = "belum_bayar";
        }

        await pb.collection("transaksi_sewa").update(editId, {
          sawah: form.sawah,
          penyewa: form.penyewa,
          tanggal_mulai: form.tanggal_mulai,
          tanggal_jatuh_tempo: form.tanggal_jatuh_tempo,
          harga_sewa: cleanHarga,
          status_bayar: newStatusBayar,
        });
        if (oldTrx?.status === "aktif" && oldSawahId !== form.sawah) {
          await pb
            .collection("sawah")
            .update(oldSawahId!, { status: "tersedia" });
          await pb.collection("sawah").update(form.sawah, { status: "disewa" });
        }
        toast("Transaksi diperbarui!", "success");
      } else {
        const newTrx = await pb.collection("transaksi_sewa").create({
          sawah: form.sawah,
          penyewa: form.penyewa,
          tanggal_mulai: form.tanggal_mulai,
          tanggal_jatuh_tempo: form.tanggal_jatuh_tempo,
          harga_sewa: cleanHarga,
          status: "aktif",
          status_bayar: form.status_bayar,
          nominal_dibayar: cleanDibayar,
        });
        await pb.collection("sawah").update(form.sawah, { status: "disewa" });
        if (cleanDibayar > 0) {
          await pb.collection("riwayat_bayar").create({
            transaksi: newTrx.id,
            tanggal: form.tanggal_mulai,
            nominal: cleanDibayar,
            keterangan:
              form.status_bayar === "lunas"
                ? "Pelunasan Awal"
                : "Pembayaran DP Awal",
          });
        }
        toast("Transaksi sewa baru dibuat!", "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast("Gagal menyimpan transaksi.", "error");
    }
  }

  function handleBatalSewa(trx: Transaksi) {
    confirm({
      title: "Batalkan Sewa?",
      message: "Data transaksi akan ditandai sebagai batal.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await pb
            .collection("transaksi_sewa")
            .update(trx.id, { status: "batal" });
          if (trx.expand?.sawah?.id)
            await pb
              .collection("sawah")
              .update(trx.expand.sawah.id, { status: "tersedia" });
          toast("Sewa dibatalkan.", "info");
          loadData();
        } catch (err) {
          toast("Gagal membatalkan sewa.", "error");
        }
      },
    });
  }

  function handleSelesai(trx: Transaksi) {
    confirm({
      title: "Selesaikan Sewa?",
      message: "Status sawah kembali Tersedia dan transaksi dikunci.",
      onConfirm: async () => {
        try {
          await pb.collection("transaksi_sewa").update(trx.id, {
            status: "selesai",
            tanggal_panen: getTodayString(),
          });
          await pb
            .collection("sawah")
            .update(trx.expand!.sawah.id, { status: "tersedia" });
          toast("Siklus panen selesai!", "success");
          loadData();
        } catch (err) {
          toast("Gagal menyelesaikan transaksi.", "error");
        }
      },
    });
  }

  function openEditModal(trx: Transaksi) {
    setForm({
      sawah: trx.expand?.sawah?.id || "",
      penyewa: trx.expand?.penyewa?.id || "",
      tanggal_mulai: trx.tanggal_mulai.split(" ")[0],
      tanggal_jatuh_tempo: trx.tanggal_jatuh_tempo
        ? trx.tanggal_jatuh_tempo.split(" ")[0]
        : "",
      harga_sewa: formatRupiah(trx.harga_sewa),
      status_bayar: trx.status_bayar,
      nominal_dibayar: formatRupiah(trx.nominal_dibayar || 0),
    });
    setEditId(trx.id);
    setIsModalOpen(true);
  }

  // LOG BULANAN
  async function openLogModal(trx: Transaksi) {
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
        } catch (err) {
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
    } catch (err) {
      toast("Gagal menyimpan log.", "error");
    }
  }

  // PEMBAYARAN (CICILAN)
  async function openPayModal(trx: Transaksi) {
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
    if (nominalBayar <= 0) return toast("Nominal tidak valid", "error");

    try {
      await pb.collection("riwayat_bayar").create({
        transaksi: payTrx.id,
        tanggal: payForm.tanggal,
        nominal: nominalBayar,
        keterangan: payForm.keterangan || "Pembayaran Termin",
      });
      const totalDibayarBaru = (payTrx.nominal_dibayar || 0) + nominalBayar;
      let statusBaru = "dp";
      if (totalDibayarBaru >= payTrx.harga_sewa) statusBaru = "lunas";

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
    } catch (err) {
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
          const totalDibayarBaru = (payTrx!.nominal_dibayar || 0) - pay.nominal;
          let statusBaru = "dp";
          if (totalDibayarBaru <= 0) statusBaru = "belum_bayar";
          else if (totalDibayarBaru >= payTrx!.harga_sewa) statusBaru = "lunas";

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
        } catch (err) {
          toast("Gagal menghapus pembayaran", "error");
        }
      },
    });
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="text-emerald-500" /> Transaksi Sewa
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Catat penyewaan dan pantau siklus tanam hingga panen.
          </p>
        </div>
        <button
          onClick={openTambahModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-emerald-200 cursor-pointer"
        >
          <Plus size={18} /> Buat Transaksi
        </button>
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama sawah atau penyewa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
          />
        </div>

        {/* Filter Penyewa */}
        <div className="relative w-full md:w-56">
          <User className="absolute left-3 top-3 text-slate-400" size={20} />
          <select
            value={filterPenyewa}
            onChange={(e) => setFilterPenyewa(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm appearance-none cursor-pointer text-slate-700 font-medium text-sm truncate"
          >
            <option value="semua">Semua Penyewa</option>
            {penyewaList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
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

        {/* Filter Status */}
        <div className="relative w-full md:w-48">
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
        <div className="relative w-full md:w-48">
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
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Sawah & Penyewa
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Tanggal & Durasi
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Harga & Pembayaran
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Status Sewa
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.map((trx) => (
                  <tr
                    key={trx.id}
                    className={`hover:bg-slate-50/80 transition-colors ${trx.status === "batal" ? "opacity-60 bg-slate-50" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <Sprout size={16} className="text-emerald-500" />{" "}
                        {trx.expand?.sawah?.nama || "Sawah Dihapus"}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <User size={14} />{" "}
                        {trx.expand?.penyewa?.nama || "Penyewa Dihapus"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">
                        {formatDate(trx.tanggal_mulai)}
                      </div>
                      {trx.tanggal_jatuh_tempo &&
                        trx.status_bayar !== "lunas" && (
                          <div className="text-xs text-red-600 font-semibold mt-0.5">
                            Jatuh Tempo: {formatDate(trx.tanggal_jatuh_tempo)}
                          </div>
                        )}
                      {trx.tanggal_panen && (
                        <div className="text-xs text-slate-500">
                          Selesai: {formatDate(trx.tanggal_panen)}
                        </div>
                      )}
                      <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1 bg-emerald-50 w-fit px-2 py-0.5 rounded-md border border-emerald-100">
                        <Clock size={12} />{" "}
                        {trx.status === "aktif" ? "Berjalan " : "Durasi "}{" "}
                        {calculateDuration(
                          trx.tanggal_mulai,
                          trx.tanggal_panen,
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-bold mb-1">
                        Rp {trx.harga_sewa.toLocaleString("id-ID")}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span
                          className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
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
                        {trx.status_bayar !== "lunas" && (
                          <span className="text-[11px] text-slate-500">
                            Kurang: Rp{" "}
                            {(
                              trx.harga_sewa - (trx.nominal_dibayar || 0)
                            ).toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${trx.status === "aktif" ? "bg-amber-50 text-amber-700 border-amber-200" : trx.status === "selesai" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-300"}`}
                      >
                        {trx.status === "aktif"
                          ? "Berjalan"
                          : trx.status === "selesai"
                            ? "Panen"
                            : "Batal"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleRenewLease(trx)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Perpanjang Sewa (Musim Berikutnya)"
                        >
                          <RotateCw size={18} />
                        </button>
                        {trx.status_bayar !== "lunas" &&
                          trx.status === "aktif" && (
                            <button
                              onClick={() => sendWATagihan(trx)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Tagih via WhatsApp"
                            >
                              <MessageCircle size={18} />
                            </button>
                          )}
                        <button
                          onClick={() => openPayModal(trx)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Kelola Pembayaran & Cicilan"
                        >
                          <Wallet size={18} />
                        </button>
                        <button
                          onClick={() => setNotaTrx(trx)}
                          className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Nota"
                        >
                          <Printer size={18} />
                        </button>
                        <button
                          onClick={() => openLogModal(trx)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Log Bulanan"
                        >
                          <Calendar size={18} />
                        </button>
                        {trx.status === "aktif" && (
                          <>
                            <button
                              onClick={() => openEditModal(trx)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Transaksi"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleSelesai(trx)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Tandai Panen Selesai"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button
                              onClick={() => handleBatalSewa(trx)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Batalkan Sewa"
                            >
                              <Ban size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      {searchQuery ||
                      filterStatus !== "semua" ||
                      filterPenyewa !== "semua" ||
                      filterBayar !== "semua"
                        ? "Tidak ada transaksi yang cocok dengan filter."
                        : "Belum ada transaksi sewa."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredList.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Menampilkan{" "}
              <span className="font-semibold text-slate-700">
                {indexOfFirstItem + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(indexOfLastItem, filteredList.length)}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-700">
                {filteredList.length}
              </span>{" "}
              transaksi
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => paginate(index + 1)}
                  className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg border transition-colors cursor-pointer ${currentPage === index + 1 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}