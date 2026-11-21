import { formatDate, formatWA } from "./formatters";
import { ROUTES } from "../routes";
import type { TransaksiSewa } from "../types";

// ============================================================
// WHATSAPP UTILITY — SawahKu
// Fungsi untuk mengirim pesan tagihan via WhatsApp
// ============================================================

/**
 * Buat URL WhatsApp untuk menagih pembayaran sewa
 * @returns URL string WhatsApp, atau null jika kontak kosong
 */
export function buildWATagihanURL(trx: TransaksiSewa): string | null {
  const penyewaNama = trx.expand?.penyewa?.nama || "Penyewa";
  const sawahNama = trx.expand?.sawah?.nama || "Sawah";
  const kontak = trx.expand?.penyewa?.kontak || "";
  const sisa = trx.harga_sewa - (trx.nominal_dibayar || 0);
  const jatuhTempo = trx.tanggal_jatuh_tempo
    ? formatDate(trx.tanggal_jatuh_tempo)
    : "-";
  const linkNota = `${window.location.origin}${ROUTES.NOTA_DETAIL(trx.id)}`;

  if (!kontak) return null;

  const pesan =
    `Halo Bp/Ibu *${penyewaNama}*,\n\n` +
    `Sekadar mengingatkan mengenai tagihan sewa sawah *${sawahNama}*.\n\n` +
    `• Total Sewa: Rp ${trx.harga_sewa.toLocaleString("id-ID")}\n` +
    `• Terbayar: Rp ${(trx.nominal_dibayar || 0).toLocaleString("id-ID")}\n` +
    `• *Sisa Tagihan: Rp ${sisa.toLocaleString("id-ID")}*\n` +
    `• Tanggal Jatuh Tempo: *${jatuhTempo}*\n\n` +
    `Rincian nota digital dapat diakses melalui link berikut:\n${linkNota}\n\n` +
    `Terima kasih. 🙏`;

  return `https://wa.me/${formatWA(kontak)}?text=${encodeURIComponent(pesan)}`;
}

/**
 * Kirim pesan tagihan via WhatsApp (buka tab baru)
 * @returns true jika berhasil membuka WA, false jika kontak kosong
 */
export function sendWATagihan(
  trx: TransaksiSewa,
  onNoContact?: () => void,
): boolean {
  const url = buildWATagihanURL(trx);

  if (!url) {
    onNoContact?.();
    return false;
  }

  window.open(url, "_blank");
  return true;
}