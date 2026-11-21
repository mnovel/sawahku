// ============================================================
// SHARED FORMATTERS — SawahKu
// Fungsi utilitas format yang digunakan di seluruh aplikasi
// ============================================================

/**
 * Format tanggal ke format Indonesia (contoh: "12 Jan 2025")
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format angka ke format Rupiah dengan titik pemisah ribuan (contoh: "1.500.000")
 * Digunakan untuk input field (tanpa prefix "Rp")
 */
export const formatRupiah = (val: number | string): string => {
  const numStr = val.toString().replace(/\D/g, "");
  if (!numStr) return "";
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/**
 * Mendapatkan tanggal hari ini dalam format YYYY-MM-DD
 */
export const getTodayString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Format nomor telepon ke format WhatsApp internasional (62xxx)
 */
export const formatWA = (phone: string): string => {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
  return cleaned;
};

/**
 * Hitung durasi antara 2 tanggal dalam format "X bln Y hr"
 * Jika endDateStr kosong/null, gunakan tanggal hari ini
 */
export const calculateDuration = (
  startDateStr: string,
  endDateStr?: string | null,
): string => {
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

  const parts: string[] = [];
  if (months > 0) parts.push(`${months} bln`);
  if (days > 0 || parts.length === 0) parts.push(`${days} hr`);
  return parts.join(" ");
};

/**
 * Hitung total bulan berjalan dari tanggal mulai hingga hari ini
 */
export const calculateMonthCount = (startDateStr: string): number => {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date();

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  const days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
  }
  return Math.max(0, months);
};